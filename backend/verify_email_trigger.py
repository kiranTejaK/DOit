
import requests
import sys
import random
import string
import time

# Constants
API_URL = "http://localhost:8000/api/v1"

def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

EMAIL = f"test_email_{generate_random_string()}@example.com"
PASSWORD = "password123"

def register():
    print(f"Registering user: {EMAIL}")
    resp = requests.post(f"{API_URL}/users/signup", json={
        "email": EMAIL,
        "password": PASSWORD,
        "full_name": "Test Email User"
    })
    if resp.status_code != 200:
        print(f"Registration note: {resp.text}")
    else:
        print("Registration successful.")

def login():
    response = requests.post(f"{API_URL}/login/access-token", data={
        "username": EMAIL,
        "password": PASSWORD
    })
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        sys.exit(1)
    return response.json()["access_token"]

def verify_email_trigger(token):
    print("Verifying Email Trigger...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Workspace
    resp = requests.post(f"{API_URL}/workspaces/", json={"name": "Email Test WS"}, headers=headers)
    if resp.status_code != 200:
        print(f"Create workspace failed: {resp.text}")
        return
    ws_id = resp.json()["id"]
    print(f"Created Workspace: {ws_id}")

    # 2. Create Project
    resp = requests.post(f"{API_URL}/projects/", json={"name": "Email Test Project", "workspace_id": ws_id}, headers=headers)
    if resp.status_code != 200:
        print(f"Create project failed: {resp.text}")
        return
    p_id = resp.json()["id"]
    print(f"Created Project: {p_id}")

    # 3. Get User ID for assignment
    resp = requests.get(f"{API_URL}/users/me", headers=headers)
    user_id = resp.json()["id"]

    # 4. Create Task with Assignee (Should trigger email)
    print("\n[Action] Creating Task with Assignee...")
    t_data = {
        "title": "Task with Initial Assignee",
        "project_id": p_id,
        "assignee_id": user_id
    }
    resp = requests.post(f"{API_URL}/tasks/", json=t_data, headers=headers)
    if resp.status_code != 200:
        print(f"FAIL: Create task failed: {resp.text}")
    else:
        print("PASS: Task created successfully (Check logs for email).")
        t_id = resp.json()["id"]

    # 5. Update Task with NEW Assignee (Should trigger email)
    # We'll assign it to the same user again just to trigger the "different from old" check?
    # Wait, my logic was: `if task.assignee_id and task.assignee_id != old_assignee_id:`
    # If I assign to SAME user, it won't trigger.
    # I need another user or just unassign then assign?
    # Unassign:
    print("\n[Action] Unassigning task...")
    requests.put(f"{API_URL}/tasks/{t_id}", json={"assignee_id": None}, headers=headers)
    
    # Re-assign (old was None, new is User => different => trigger)
    print("\n[Action] Re-assigning task (Should trigger email)...")
    resp = requests.put(f"{API_URL}/tasks/{t_id}", json={"assignee_id": user_id}, headers=headers)
    if resp.status_code != 200:
         print(f"FAIL: Update task failed: {resp.text}")
    else:
         print("PASS: Task updated successfully (Check logs for email).")

def main():
    try:
        register()
        token = login()
        verify_email_trigger(token)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
