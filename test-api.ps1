# DevForge API Test Script
$baseUrl = "http://localhost:8080"

# Set encoding to UTF8 for clean PowerShell output
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Running DevForge API Tests..." -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Helper to print responses
function Test-Request {
    param($method, $uri, $headers, $body)
    try {
        $params = @{
            Uri = "$baseUrl$uri"
            Method = $method
            ContentType = "application/json"
        }
        if ($headers) { $params.Headers = $headers }
        if ($body) { 
            $bodyJson = $body | ConvertTo-Json -Depth 5
            $params.Body = $bodyJson 
        }

        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "Request to $uri failed: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errBody = $reader.ReadToEnd()
            Write-Host "Response body: $errBody" -ForegroundColor Red
        }
        return $null
    }
}

# 1. Register PM User
Write-Host "1. Registering Project Manager..." -ForegroundColor Yellow
$pmUser = @{
    username = "manager1"
    email = "manager1@devforge.com"
    password = "password123"
}
$regPm = Test-Request "POST" "/api/auth/register" $null $pmUser
if ($regPm) { 
    Write-Host "PM registered successfully: $($regPm.message)" -ForegroundColor Green 
} else {
    Write-Host "PM registration skipped or failed (might already exist)." -ForegroundColor Gray
}

# 2. Register Dev User
Write-Host "`n2. Registering Developer..." -ForegroundColor Yellow
$devUser = @{
    username = "developer1"
    email = "developer1@devforge.com"
    password = "password123"
}
$regDev = Test-Request "POST" "/api/auth/register" $null $devUser
if ($regDev) { 
    Write-Host "Developer registered successfully: $($regDev.message)" -ForegroundColor Green 
} else {
    Write-Host "Developer registration skipped or failed (might already exist)." -ForegroundColor Gray
}

# 3. Log in as PM
Write-Host "`n3. Logging in as Project Manager..." -ForegroundColor Yellow
$pmLogin = Test-Request "POST" "/api/auth/login" $null $pmUser
if ($pmLogin) {
    $pmToken = $pmLogin.token
    $pmId = $pmLogin.id
    Write-Host "Logged in as PM. UserID: $pmId" -ForegroundColor Green
} else {
    Write-Host "Failed to login PM." -ForegroundColor Red
    return
}

# 4. Log in as Developer to get Dev ID
Write-Host "`n4. Logging in as Developer..." -ForegroundColor Yellow
$devLogin = Test-Request "POST" "/api/auth/login" $null $devUser
if ($devLogin) {
    $devToken = $devLogin.token
    $devId = $devLogin.id
    Write-Host "Logged in as Developer. UserID: $devId" -ForegroundColor Green
} else {
    Write-Host "Failed to login Developer." -ForegroundColor Red
    return
}

$pmHeaders = @{ Authorization = "Bearer $pmToken" }
$devHeaders = @{ Authorization = "Bearer $devToken" }

# 5. Create a Project
Write-Host "`n5. PM creates a new project..." -ForegroundColor Yellow
$projReq = @{
    name = "DevForge E-commerce Application"
    description = "Building a high-performance shopping site."
}
$project = Test-Request "POST" "/api/projects" $pmHeaders $projReq
if ($project) {
    $projId = $project.id
    Write-Host "Project created successfully! ID: $projId, Name: $($project.name)" -ForegroundColor Green
} else {
    Write-Host "Failed to create project." -ForegroundColor Red
    return
}

# 6. Add Developer to Project Members
Write-Host "`n6. PM adds Developer to project..." -ForegroundColor Yellow
$memberReq = @{ userId = $devId }
$addMember = Test-Request "POST" "/api/projects/$projId/members" $pmHeaders $memberReq
if ($addMember) {
    Write-Host "Developer added to project: $($addMember.message)" -ForegroundColor Green
}

# 7. Create a Task inside Project
Write-Host "`n7. PM creates and assigns a task to Developer..." -ForegroundColor Yellow
$taskReq = @{
    title = "Design Database Schema"
    description = "Create schemas for users, projects, and tasks."
    status = "TO_DO"
    priority = "HIGH"
    assigneeId = $devId
    dueDate = (Get-Date).ToString("yyyy-MM-dd")
}
$task = Test-Request "POST" "/api/projects/$projId/tasks" $pmHeaders $taskReq
if ($task) {
    $taskId = $task.id
    Write-Host "Task created successfully! ID: $taskId, Title: $($task.title), Assignee: $($task.assignee.username)" -ForegroundColor Green
}

# 8. Developer updates Task Status
Write-Host "`n8. Developer updates task status to IN_PROGRESS..." -ForegroundColor Yellow
$taskUpdate = @{
    title = "Design Database Schema"
    description = "Create schemas for users, projects, and tasks."
    status = "IN_PROGRESS"
    priority = "HIGH"
    assigneeId = $devId
}
$updatedTask = Test-Request "PUT" "/api/tasks/$taskId" $devHeaders $taskUpdate
if ($updatedTask) {
    Write-Host "Task updated successfully! New status: $($updatedTask.status)" -ForegroundColor Green
}

# 9. Developer gets list of project tasks
Write-Host "`n9. Developer views project tasks list..." -ForegroundColor Yellow
$tasks = Test-Request "GET" "/api/projects/$projId/tasks" $devHeaders $null
if ($tasks) {
    Write-Host "Tasks found: $($tasks.Count)" -ForegroundColor Green
    foreach ($t in $tasks) {
        Write-Host " - [$($t.status)] Task ID: $($t.id), Title: $($t.title), Assignee: $($t.assignee.username)" -ForegroundColor Gray
    }
}

Write-Host "`n==============================" -ForegroundColor Cyan
Write-Host "Tests completed successfully!" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
