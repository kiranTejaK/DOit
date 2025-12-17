
import requests
import sys

# Constants
API_URL = "http://localhost:8000/api/v1"

import random
import string

# Constants
API_URL = "http://localhost:8000/api/v1"

def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

EMAIL = f"test_{generate_random_string()}@example.com"
PASSWORD = "password123"

def register():
    print(f"Registering user: {EMAIL}")
    resp = requests.post(f"{API_URL}/users/signup", json={
        "email": EMAIL,
        "password": PASSWORD,
        "full_name": "Test User"
    })
    if resp.status_code != 200:
        # Check if already exists (should happen rarely with random email, but if so just login)
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

def verify_workspace_roles(token):
    print("Verifying Workspace Roles...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Workspace
    ws_data = {"name": "Test Role Workspace", "description": "Testing roles"}
    resp = requests.post(f"{API_URL}/workspaces/", json=ws_data, headers=headers)
    if resp.status_code != 200:
        print(f"Create workspace failed: {resp.text}")
        return
    ws_id = resp.json()["id"]
    print(f"Created Workspace: {ws_id}")

    # 2. Get Members
    resp = requests.get(f"{API_URL}/workspaces/{ws_id}/members", headers=headers)
    if resp.status_code != 200:
        print(f"Get members failed: {resp.text}")
        return
    
    data = resp.json()
    members = data["data"]
    print(f"Members found: {len(members)}")
    
    # Check if current user is owner
    found = False
    for m in members:
        if m["email"] == EMAIL:
            print(f"User {m['email']} has role: {m.get('role')}")
            if m.get("role") == "owner":
                found = True
    
    if found:
        print("PASS: Creator has owner role.")
    else:
        print("FAIL: Creator does not have owner role.")

    return ws_id

def verify_my_tasks(token, ws_id):
    print("\nVerifying My Tasks Project Info...")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Project
    p_data = {
        "name": "Test Project",
        "workspace_id": ws_id,
        "color": "#ff0000"
    }
    resp = requests.post(f"{API_URL}/projects/", json=p_data, headers=headers)
    if resp.status_code != 200:
        print(f"Create project failed: {resp.text}")
        return
    p_id = resp.json()["id"]
    print(f"Created Project: {p_id}")

    # 2. Create Task
    t_data = {
        "title": "Test Task with Project",
        "project_id": p_id,
        "status": "todo",
        "priority": "medium"
    }
    resp = requests.post(f"{API_URL}/tasks/", json=t_data, headers=headers)
    if resp.status_code != 200:
        print(f"Create task failed: {resp.text}")
        return
    t_id = resp.json()["id"]
    print(f"Created Task: {t_id}")

    # 3. Get My Tasks (filter by assignee - implicitly currentUser in logic or explicit)
    # The API endpoint is /tasks/. It filters by current user permissions/membership usually.
    # To get 'My Tasks' specifically we pass assignee_id or just check the list if I am assigned (which I am as creator? No, creator is owner, assignee might be None).
    # Let's assign it to me.
    
    # Get user id first
    resp = requests.get(f"{API_URL}/users/me", headers=headers)
    user_id = resp.json()["id"]

    # Update task to assign to me
    requests.put(f"{API_URL}/tasks/{t_id}", json={"assignee_id": user_id}, headers=headers)

    # Now View My Tasks
    resp = requests.get(f"{API_URL}/tasks/?assignee_id={user_id}", headers=headers)
    if resp.status_code != 200:
        print(f"Get tasks failed: {resp.text}")
        return
    
    tasks = resp.json()["data"]
    # Find our task
    target_task = next((t for t in tasks if t["id"] == t_id), None)
    
    if target_task:
        print(f"Task found: {target_task['title']}")
        print(f"Project Name: {target_task.get('project_name')}")
        print(f"Project Color: {target_task.get('project_color')}")
        
        if target_task.get("project_name") == "Test Project":
            print("PASS: Task has correct project name.")
        else:
            print("FAIL: Task missing or incorrect project name.")
    else:
        print("FAIL: Task not found in list.")


def main():
    try:
        register()
        token = login()
        ws_id = verify_workspace_roles(token)
        if ws_id:
            verify_my_tasks(token, ws_id)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
