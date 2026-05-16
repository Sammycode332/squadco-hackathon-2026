$BASE = "http://localhost:3000"
$PASS = 0
$FAIL = 0

function Test-API {
    param($label, $method, $url, $body = $null, $headers = @{})
    try {
        $params = @{ Uri = $url; Method = $method; Headers = $headers; ErrorAction = "Stop" }
        if ($body) {
            $params.Body = ($body | ConvertTo-Json -Depth 5)
            $params.ContentType = "application/json"
        }
        $r = Invoke-RestMethod @params
        Write-Host "  PASS  [$method] $label" -ForegroundColor Green
        $script:PASS++
        return $r
    } catch {
        $errMsg = $_.ErrorDetails.Message
        if (-not $errMsg) { $errMsg = $_.Exception.Message }
        Write-Host "  FAIL  [$method] $label" -ForegroundColor Red
        Write-Host "        $errMsg" -ForegroundColor DarkRed
        $script:FAIL++
        return $null
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "  SNI Backend-AI -- Full API Test Suite"
Write-Host "========================================"
Write-Host ""

# 1. HEALTH
Write-Host "-- HEALTH CHECK ------------------------"
Test-API "Health check" GET "$BASE/health"

# 2. AUTH
Write-Host ""
Write-Host "-- AUTH --------------------------------"
Test-API "Register duplicate phone (expect fail)" POST "$BASE/api/auth/register" @{
    name = "Samuel John"; phone = "08012345678"; password = "password123"; role = "agent"
}
$regNew = Test-API "Register new agent" POST "$BASE/api/auth/register" @{
    name = "Test Agent"; phone = "09099887766"; password = "secret123"; role = "agent"
}
$loginResult = Test-API "Login existing user" POST "$BASE/api/auth/login" @{
    phone = "08012345678"; password = "password123"
}
Test-API "Login wrong password (expect fail)" POST "$BASE/api/auth/login" @{
    phone = "08012345678"; password = "wrongpassword"
}
Test-API "Login short password - validation (expect fail)" POST "$BASE/api/auth/login" @{
    phone = "08012345678"; password = "abc"
}

$TOKEN = ""
if ($loginResult) { $TOKEN = $loginResult.data.token }
if (-not $TOKEN) {
    Write-Host "  No token obtained. Stopping." -ForegroundColor Red
    exit 1
}
Write-Host "  Token: $($TOKEN.Substring(0,50))..." -ForegroundColor DarkGray

$AUTH = @{ Authorization = "Bearer $TOKEN" }
$BAD  = @{ Authorization = "Bearer badtoken.invalid.xyz" }

# 3. AUTH MIDDLEWARE
Write-Host ""
Write-Host "-- AUTH MIDDLEWARE ---------------------"
Test-API "No token on protected route (expect 401)" GET "$BASE/api/profiles"
Test-API "Bad token on protected route (expect 401)" GET "$BASE/api/profiles" $null $BAD

# 4. PROFILES
Write-Host ""
Write-Host "-- PROFILES ----------------------------"
Test-API "Create profile missing fields (expect 422)" POST "$BASE/api/profiles" @{
    fullName = "Incomplete"
} $AUTH

$traderBody = @{
    fullName = "Amina Musa"; phone = "07011223344"; type = "trader"
    channel = "whatsapp"; language = "hausa"; location = "Kano"
    trade = "vegetables"; skills = @("sales","retail")
    bio = "I sell tomatoes and vegetables at Mile 12 market"
    monthlyIncome = 45000
    trustSignals = @{ communityEndorsed = $true; marketRegistered = $true }
}
$trader = Test-API "Create trader profile (Amina)" POST "$BASE/api/profiles" $traderBody $AUTH

$seekerBody = @{
    fullName = "Chidi Okafor"; phone = "08033445566"; type = "job_seeker"
    channel = "ussd"; language = "igbo"; location = "Lagos"
    skills = @("electrical","solar")
    bio = "Solar panel installer looking for apprenticeship"
    monthlyIncome = 20000
    trustSignals = @{ communityEndorsed = $true }
}
$seeker = Test-API "Create job_seeker profile (Chidi)" POST "$BASE/api/profiles" $seekerBody $AUTH

$workerBody = @{
    fullName = "Fatima Aliyu"; phone = "07088990011"; type = "worker"
    channel = "agent"; language = "hausa"; location = "Kano"
    trade = "tailoring"; skills = @("tailoring","fashion")
    monthlyIncome = 35000
    trustSignals = @{ marketRegistered = $true }
}
$worker = Test-API "Create worker profile (Fatima)" POST "$BASE/api/profiles" $workerBody $AUTH

Test-API "List all profiles" GET "$BASE/api/profiles" $null $AUTH

$PID1 = if ($trader) { $trader.data.id } else { "eco_fake" }
$PID2 = if ($seeker) { $seeker.data.id } else { "eco_fake" }
$PID3 = if ($worker) { $worker.data.id } else { "eco_fake" }

Test-API "Get profile by ID (Amina)" GET "$BASE/api/profiles/$PID1" $null $AUTH
Test-API "Get non-existent profile (expect 404)" GET "$BASE/api/profiles/eco_fake999" $null $AUTH

Test-API "Match opportunities (Amina - trader)" GET "$BASE/api/profiles/$PID1/opportunities" $null $AUTH
Test-API "Match opportunities (Chidi - job seeker)" GET "$BASE/api/profiles/$PID2/opportunities" $null $AUTH
Test-API "Match opportunities (Fatima - worker)" GET "$BASE/api/profiles/$PID3/opportunities" $null $AUTH

# 5. PAYMENTS
Write-Host ""
Write-Host "-- PAYMENTS ----------------------------"
Test-API "Create virtual account - mock mode" POST "$BASE/api/payments/virtual-accounts/$PID1" @{
    email = "amina@example.com"
} $AUTH

Test-API "Simulate payment 1 (15000)" POST "$BASE/api/payments/simulate" @{
    profileId = $PID1; amount = 15000; channel = "squad_virtual_account"
    status = "success"; reference = "TXN_001"
} $AUTH

Test-API "Simulate payment 2 (22000)" POST "$BASE/api/payments/simulate" @{
    profileId = $PID1; amount = 22000; channel = "squad_transfer"
    status = "success"; reference = "TXN_002"
} $AUTH

Test-API "Simulate payment 3 (8500)" POST "$BASE/api/payments/simulate" @{
    profileId = $PID1; amount = 8500; channel = "squad_virtual_account"
    status = "success"; reference = "TXN_003"
} $AUTH

Test-API "Simulate payment missing amount (expect 422)" POST "$BASE/api/payments/simulate" @{
    profileId = $PID1
} $AUTH

Test-API "List all payments" GET "$BASE/api/payments" $null $AUTH

# 6. SCORES
Write-Host ""
Write-Host "-- ECONOMIC SCORES ---------------------"
$s1 = Test-API "Calculate score (Amina - 3 payments)" GET "$BASE/api/scores/$PID1" $null $AUTH
$s2 = Test-API "Calculate score (Chidi - no payments)" GET "$BASE/api/scores/$PID2" $null $AUTH
$s3 = Test-API "Calculate score (Fatima - agent channel)" GET "$BASE/api/scores/$PID3" $null $AUTH
Test-API "Score non-existent profile (expect 404)" GET "$BASE/api/scores/eco_fake999" $null $AUTH

if ($s1) { Write-Host "  Amina  score=$($s1.data.score) band=[$($s1.data.band)] limit=N$($s1.data.suggestedLimit)" -ForegroundColor Cyan }
if ($s2) { Write-Host "  Chidi  score=$($s2.data.score) band=[$($s2.data.band)] limit=N$($s2.data.suggestedLimit)" -ForegroundColor Cyan }
if ($s3) { Write-Host "  Fatima score=$($s3.data.score) band=[$($s3.data.band)] limit=N$($s3.data.suggestedLimit)" -ForegroundColor Cyan }

# 7. WEBHOOKS
Write-Host ""
Write-Host "-- WEBHOOKS (Squad) --------------------"
Test-API "Squad webhook nested data format" POST "$BASE/api/webhooks/squad" @{
    data = @{
        transaction_ref = "SQUAD_WH_001"
        amount = 30000
        transaction_status = "success"
        customer_identifier = $PID1
        principal_amount = 30000
    }
}
Test-API "Squad webhook flat format" POST "$BASE/api/webhooks/squad" @{
    transaction_ref = "SQUAD_WH_002"
    amount = 12000
    status = "success"
    customer_identifier = $PID2
}

# 8. DASHBOARD
Write-Host ""
Write-Host "-- DASHBOARD ---------------------------"
$dash = Test-API "Government dashboard overview" GET "$BASE/api/dashboard" $null $AUTH
if ($dash) {
    $d = $dash.data
    Write-Host "  Onboarded : $($d.usersOnboarded)" -ForegroundColor Cyan
    Write-Host "  PaymentVol: N$($d.paymentVolume)" -ForegroundColor Cyan
    Write-Host "  CreditRdy : $($d.creditReady)" -ForegroundColor Cyan
    Write-Host "  ByLocation: $($d.byLocation | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    Write-Host "  ByType    : $($d.byType | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    $es = $d.economicSignals
    Write-Host "  ActivityCaptured : $($es.informalActivityCaptured)" -ForegroundColor Cyan
    Write-Host "  JobsMatched      : $($es.estimatedJobsMatched)" -ForegroundColor Cyan
    Write-Host "  CreditUnlocked   : N$($es.estimatedCreditUnlocked)" -ForegroundColor Cyan
}

# 9. USERS
Write-Host ""
Write-Host "-- USERS -------------------------------"
Test-API "List all system users" GET "$BASE/api/users" $null $AUTH

# 10. 404 ROUTE
Write-Host ""
Write-Host "-- ERROR HANDLING ----------------------"
Test-API "Unknown route (expect 404)" GET "$BASE/api/unknown-route" $null $AUTH

# SUMMARY
Write-Host ""
Write-Host "========================================"
Write-Host "  PASSED : $PASS"
Write-Host "  FAILED : $FAIL"
Write-Host "  TOTAL  : $($PASS + $FAIL)"
Write-Host "========================================"
Write-Host ""
