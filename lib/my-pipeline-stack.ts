import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Function } from "aws-cdk-lib/aws-lambda";
import * as path from 'path';

export class MyPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- 準備: バケットとLambda ---
    // ソースおよびデプロイ先となるS3バケット
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      versioned: true, // S3ソースにはバージョニングが必要
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const deployBucket = new s3.Bucket(this, 'DeployBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 最後に実行するLambda関数
    // const targetLambda = new lambda.Function(this, 'PipelineTargetLambda', {
    //   runtime: lambda.Runtime.NODEJS_20_X,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromInline(`
    //     exports.handler = async (event) => {
    //       console.log("Pipeline Lambda Triggered!", JSON.stringify(event, null, 2));
    //       return { statusCode: 200 };
    //     };
    //   `),
    // });

    // --- パイプライン定義 ---
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this, 'MyPipeline', {
      pipelineName: 'S3ToLambdaPipeline',
    });

    // 1. Source ステージ (S3からソースを取得)
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.S3SourceAction({
          actionName: 'S3_Source',
          bucket: sourceBucket,
          bucketKey: 'source.zip', // 監視するファイル名
          output: sourceOutput,
        }),
      ],
    });

    // 2. Build ステージ (CodeBuildでビルド)
    const project = new codebuild.PipelineProject(this, 'MyBuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      // buildspec.yml を直接定義（ファイルとしてリポジトリに置いてもOK）
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'echo Build started on `date`',
              'ls -al',
              'ls -al fir-nuxt',
              // 'npm install',
              // 'npm run generate', // 例: 全ファイルをdistにコピー
              // 'echo "Build info" > dist/build_info.txt'
            ],
          },
        },
        artifacts: {
          'base-directory': 'fir-nuxt/.output/public',
          files: ['**/*'],
        },
      }),
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'CodeBuild',
          project: project,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // 3. Deploy ステージ (ビルドしたものをS3にアップロード)
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.S3DeployAction({
          actionName: 'S3_Deploy',
          bucket: deployBucket,
          input: buildOutput,
          extract: true, // zipを展開して保存する場合
        }),
      ],
    });

    const targetLambda = new Function(this, "PipelineTargetLambda", {
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: "lambda_function.handler",
      memorySize: 256,
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda_py/set-index-html-metadate")),
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET_NAME: deployBucket.bucketName,
      },
    });

    deployBucket.grantReadWrite(targetLambda)
    
    targetLambda.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['codepipeline:PutJobSuccessResult', 'codepipeline:PutJobFailureResult'],
      resources: ['*']
    }));

    // 4. Invoke ステージ (Lambdaを実行)
    pipeline.addStage({
      stageName: 'InvokeLambda',
      actions: [
        new codepipeline_actions.LambdaInvokeAction({
          actionName: 'Lambda_Invoke',
          lambda: targetLambda,
        }),
      ],
    });

  }
}