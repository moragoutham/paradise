import sys
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_e2e_test():
    client = httpx.Client(timeout=10.0)

    print("\n=======================================================")
    print("      FrameVault End-to-End System Test")
    print("=======================================================\n")

    # 1. Health Check
    print("1. Testing /health endpoint...")
    res = client.get("http://127.0.0.1:8000/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(f"   [PASS] Health response: {res.json()}")

    # 2. Registration
    print("\n2. Testing User Registration (/auth/register)...")
    email = "devops.lead@framevault.io"
    password = "Password123!Secure"
    res = client.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    if res.status_code == 409:
        print("   [INFO] User already registered, proceeding to login.")
    else:
        assert res.status_code == 201, f"Registration failed: {res.text}"
        print(f"   [PASS] Registered successfully: {res.json()['user']['email']}")

    # 3. Login
    print("\n3. Testing User Login (/auth/login)...")
    res = client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_data = res.json()
    token = token_data["access_token"]
    user_id = token_data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"   [PASS] Login successful! Token issued for user ID: {user_id}")

    # 4. User profile (/auth/me)
    print("\n4. Testing /auth/me...")
    res = client.get(f"{BASE_URL}/auth/me", headers=headers)
    assert res.status_code == 200
    print(f"   [PASS] Authenticated user: {res.json()['email']}")

    # 5. Create Collection
    print("\n5. Testing Collection Creation (/collections)...")
    col_payload = {
        "name": "AWS Production Architecture",
        "description": "VPC topologies, security groups, and S3 asset diagrams"
    }
    res = client.post(f"{BASE_URL}/collections", json=col_payload, headers=headers)
    assert res.status_code == 201, f"Create collection failed: {res.text}"
    collection = res.json()
    col_id = collection["id"]
    print(f"   [PASS] Created collection: '{collection['name']}' (ID: {col_id})")

    # 6. S3 Presigned Upload Flow
    print("\n6. Testing S3 Presigned Upload Workflow...")
    with open("c:\\pr\\paradise\\test-diagram.png", "rb") as f:
        file_bytes = f.read()

    # Step A: Request Presigned URL
    upload_req = {
        "title": "AWS Cloud VPC Diagram",
        "description": "Multi-tier architecture with public and private subnets",
        "content_type": "image/png",
        "file_size": len(file_bytes),
        "file_name": "test-diagram.png",
        "collection_id": col_id,
        "tags": ["aws", "vpc", "s3", "devops"]
    }
    res = client.post(f"{BASE_URL}/assets/upload-url", json=upload_req, headers=headers)
    assert res.status_code == 201, f"Request upload URL failed: {res.text}"
    upload_data = res.json()
    asset_id = upload_data["asset_id"]
    upload_url = upload_data["upload_url"]
    s3_key = upload_data["s3_key"]
    print(f"   [PASS] Step A: Generated presigned upload URL for key: {s3_key}")

    # Step B: Direct Browser-to-Storage PUT upload
    if upload_url.startswith("/"):
        full_upload_url = f"http://127.0.0.1:8000{upload_url}"
    else:
        full_upload_url = upload_url

    put_res = client.put(full_upload_url, content=file_bytes, headers={"Content-Type": "image/png"})
    assert put_res.status_code in [200, 204], f"Storage PUT upload failed: {put_res.status_code}"
    print("   [PASS] Step B: Direct PUT upload executed successfully!")

    # Step C: Confirm Upload with Backend API
    confirm_res = client.patch(f"{BASE_URL}/assets/{asset_id}/confirm-upload", headers=headers)
    assert confirm_res.status_code == 200, f"Confirm upload failed: {confirm_res.text}"
    asset_confirmed = confirm_res.json()
    print(f"   [PASS] Step C: Upload confirmed! Asset is now live with preview URL: {asset_confirmed['preview_url']}")

    # 7. List Assets
    print("\n7. Testing Assets Listing & Filtering (/assets)...")
    res = client.get(f"{BASE_URL}/assets", headers=headers)
    assert res.status_code == 200
    assets_list = res.json()
    assert assets_list["total"] >= 1
    print(f"   [PASS] Retrieved {assets_list['total']} asset(s). First asset title: '{assets_list['items'][0]['title']}'")

    # 8. Favorite Asset
    print("\n8. Testing Favorite Toggle (/assets/{id})...")
    res = client.patch(f"{BASE_URL}/assets/{asset_id}", json={"is_favorite": True}, headers=headers)
    assert res.status_code == 200
    assert res.json()["is_favorite"] is True
    print(f"   [PASS] Asset '{asset_id}' marked as favorite!")

    # 9. Dashboard Stats Summary
    print("\n9. Testing Dashboard Stats Summary (/assets/stats/summary)...")
    res = client.get(f"{BASE_URL}/assets/stats/summary", headers=headers)
    assert res.status_code == 200
    stats = res.json()
    print(f"   [PASS] Dashboard Stats -> Total Assets: {stats['total_assets']}, Collections: {stats['total_collections']}, Storage: {stats['total_storage_bytes']} bytes, Favorites: {stats['favorite_count']}")

    # 10. Frontend Availability
    print("\n10. Testing Frontend Server (http://127.0.0.1:3000/ or :5173/)...")
    front_url = "http://127.0.0.1:3000/"
    try:
        front_res = client.get(front_url)
    except Exception:
        front_url = "http://127.0.0.1:5173/"
        front_res = client.get(front_url)
    assert front_res.status_code == 200
    assert "FrameVault" in front_res.text
    print(f"   [PASS] Frontend server is live at {front_url} and serving the FrameVault single page application!")

    print("\n=======================================================")
    print("   ALL 10 END-TO-END WORKFLOW TESTS PASSED (100%)!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_e2e_test()
