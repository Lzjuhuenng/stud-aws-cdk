#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { StudCdkStack } from '../lib/stud-cdk-stack';
import { MyPipelineStack } from '../lib/my-pipeline-stack';
import { MyStepFunctionStack } from '../lib/sfn-stack';
import { Lambda } from 'aws-cdk-lib/aws-ses-actions';

const app = new cdk.App();
new StudCdkStack(app, 'StudCdkStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new MyPipelineStack(app,'MyPipelineStack', {
  
});

const environments = [
  { 
    id: 'UAT', 
    account: 'XXXXXXX', 
    region: 'ap-northeast-1',
    lambdaArn: 'arn:aws:lambda:ap-northeast-1:XXX:function:hello-lambda'
  },
  { 
    id: 'STG', 
    account: 'XXXXXX', 
    region: 'ap-northeast-1',
    lambdaArn: 'arn:aws:lambda:ap-northeast-1:XXXXX:function:CdkHelloWorldLambda' 
  },
  // { 
  //   id: 'PRD', 
  //   account: 'XXXX', 
  //   region: 'us-east-1',
  //   lambdaArn: ''
  // },
];

for (const env of environments) {
  new MyStepFunctionStack(app, `SfnStack-${env.id}`, {
    env: { account: env.account, region: env.region },
    lambdaArn: env.lambdaArn
  });
}
