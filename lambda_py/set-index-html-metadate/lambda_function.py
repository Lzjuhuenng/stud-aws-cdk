
import os
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client("s3")

# 環境変数（必要に応じて CDK 側で設定）
BUCKET_NAME = os.environ.get("BUCKET_NAME")   # 例: "my-bucket"
TARGET_KEY  = "index.html" #os.environ.get("TARGET_KEY")    # 例: "incoming/special.csv"
# s3://studcdkstack-ingestbucket2b3522fa-cwcz38smqwoa/aaa.csv
# 追加/更新したいメタデータ（例）
# 注意: S3のUser-defined metadataは小文字で扱われがちなので、キーは小文字推奨
METADATA_PATCH = {
    "x-my-flag": "true",
    "owner": "lambda-2",
}

def handler(event, context):
    cp = boto3.client("codepipeline")
    job_id = event['CodePipeline.job']['id']

    if not BUCKET_NAME or not TARGET_KEY:
        raise RuntimeError("BUCKET_NAME and TARGET_KEY must be set")

    try:
        # 1) 現在のオブジェクト情報を取得（メタデータ・ETag等）
        head = s3.head_object(Bucket=BUCKET_NAME, Key=TARGET_KEY)
        old_metadata = head.get("Metadata", {})  # user-defined metadata
        etag = head.get("ETag")                  # 例: '"abc..."'

        # 2) 既存メタデータをベースにパッチ適用（上書き）
        new_metadata = dict(old_metadata)
        new_metadata.update(METADATA_PATCH)

        # 3) タグを保持したい場合：GetObjectTaggingで取得→CopyObjectにTagging付与
        # tagging_str = None
        # try:
        #     tag_resp = s3.get_object_tagging(Bucket=BUCKET_NAME, Key=TARGET_KEY)
        #     tagset = tag_resp.get("TagSet", [])
        #     if tagset:
        #         # "k=v&k2=v2" 形式に変換
        #         tagging_str = "&".join(
        #             f"{_url_escape(t['Key'])}={_url_escape(t['Value'])}" for t in tagset
        #         )
        #         print(tagging_str)
        # except ClientError as e:
        #     # タグ取得権限がない/タグなしなどはスキップ
        #     print("Tagging read skipped:", e.response.get("Error", {}).get("Code"))

        # 4) CopyObject で同じキーへ上書きコピー（MetadataDirective=REPLACE）
        #    競合防止: CopySourceIfMatch に ETag を指定（途中で更新されたら失敗）
        kwargs = {
            "Bucket": BUCKET_NAME,
            "Key": TARGET_KEY,
            "CopySource": {"Bucket": BUCKET_NAME, "Key": TARGET_KEY},
            "Metadata": new_metadata,
            "MetadataDirective": "REPLACE",
            "CopySourceIfMatch": etag,  # 競合防止（不要なら削除OK）
            "CacheControl": "no-cache, no-store, must-revalidate"
        }

        # ContentTypeなどのシステムメタデータを維持したい場合は明示的に引き継ぐ
        # （REPLACE だと未指定項目が落ちる可能性があるため）
        if "ContentType" in head:
            kwargs["ContentType"] = head["ContentType"]
        # if "CacheControl" in head:
        #     kwargs["CacheControl"] = head["CacheControl"]
        # if "ContentDisposition" in head:
        #     kwargs["ContentDisposition"] = head["ContentDisposition"]
        # if "ContentEncoding" in head:
        #     kwargs["ContentEncoding"] = head["ContentEncoding"]
        # if "ContentLanguage" in head:
        #     kwargs["ContentLanguage"] = head["ContentLanguage"]

        # SSE-KMS 等の暗号化設定を維持したい場合（必要なら）
        # head から拾える場合だけ引き継ぎ
        # if head.get("ServerSideEncryption"):
        #     kwargs["ServerSideEncryption"] = head["ServerSideEncryption"]
        # if head.get("SSEKMSKeyId"):
        #     kwargs["SSEKMSKeyId"] = head["SSEKMSKeyId"]

        # タグを維持
        # if tagging_str:
        #     kwargs["Tagging"] = tagging_str
        #     kwargs["TaggingDirective"] = "REPLACE"

        resp = s3.copy_object(**kwargs)

        print("Metadata updated:", {
            "bucket": BUCKET_NAME,
            "key": TARGET_KEY,
            "old_metadata": old_metadata,
            "new_metadata": new_metadata,
            "copy_result": resp.get("CopyObjectResult", {}),
        })

        cp.put_job_success_result(jobId=job_id)
        
        return {"ok": True, "bucket": BUCKET_NAME, "key": TARGET_KEY}

    except ClientError as e:
        code = e.response.get("Error", {}).get("Code")
        msg = e.response.get("Error", {}).get("Message")
        print(f"Failed: {code} - {msg}")
        cp.put_job_failure_result(
            jobId=job_id,
            failureDetails={
                'type': 'JobFailed',
                'message': str(e)
            }
        )
        raise