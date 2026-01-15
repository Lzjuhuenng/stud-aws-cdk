import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Function } from "aws-cdk-lib/aws-lambda";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class StudCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 定义 Lambda 函数
    const myLambda = new NodejsFunction(this, 'MyFirstLambda', {
      runtime: lambda.Runtime.NODEJS_LATEST, // 运行环境
      entry: path.join(__dirname, '../lambda/hello.ts'), // 入口文件
      handler: 'handler', // 导出的函数名
      functionName: 'CdkHelloWorldLambda', // 在 AWS 控制台显示的名称
      // bundling: {
      //   minify: false, // 是否压缩代码
      //   // sourceMap: true, // 是否生成 source map（方便在线调试 TS 代码）
      //   target: 'es2020'
      // }
    });

    // 输出 Lambda ARN (可选)
    new cdk.CfnOutput(this, 'LambdaArn', {
      value: myLambda.functionArn,
    });
    
    // ① S3 Bucket（例：新規作成）
    const bucket = new s3.Bucket(this, "IngestBucket", {
      // 本番で既存Bucketを触る場合は、勝手に削除されない設定を推奨
      // removalPolicy: cdk.RemovalPolicy.RETAIN,
      // autoDeleteObjects: false,
      // versioned: true,
    });

     // ② Lambda（TS を entry にして OK、デプロイ時に自動ビルドされる）
    const fn = new Function(this, "S3PutHandler", {
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: "lambda_function.handler",
      memorySize: 256,
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda_py/s3-put")),
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    // ③ Lambda が S3 からオブジェクトを読めるように権限付与
    bucket.grantRead(fn);

    // ④ S3 PUT（ObjectCreated）イベントで Lambda を起動
    //    prefix/suffix でフィルタ可能（例：incoming/ 配下の .csv のみ）
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(fn),
      {
        prefix: "",
        suffix: ".csv",
      }
    );

    new cdk.CfnOutput(this, "BucketName", { value: bucket.bucketName });
  }
}