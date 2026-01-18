import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

interface SfnStackProps extends cdk.StackProps {
  lambdaArn: string; // 外部传入的 Lambda ARN
}

export class MyStepFunctionStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: SfnStackProps) {
    super(scope, id, props);

    // 1. 引用外部已有的 Lambda 函数
    const targetLambda = lambda.Function.fromFunctionArn(this, 'ImportedLambda', props.lambdaArn);

    // 2. 创建状态机
    const stateMachine = new sfn.StateMachine(this, 'MyStateMachine', {
      stateMachineName: `DataProcessor-${this.account}`,
      // 使用 fromFile 自动处理路径
      definitionBody: sfn.DefinitionBody.fromFile(
        path.join(__dirname, '../resources/state-machine.yaml')
      ),
      // 关键点：在这里替换 YAML 中的 ${myLambdaArn}
      definitionSubstitutions: {
        myLambdaArn: props.lambdaArn,
      },
    });

    // 3. 专家建议：必须手动授予状态机调用该 Lambda 的权限
    targetLambda.grantInvoke(stateMachine);
  }
}