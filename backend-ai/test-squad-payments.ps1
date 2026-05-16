$BASE = "http://localhost:3000"
$PASS = 0
$FAIL = 0

function Test-API {
    param($label, $method, $url, $body = $null, $headers = @{})
    try {
        $params = @{ Uri = $url; Method = $method; Headers = $headers; ErrorAction = "Stop" }
        if ($body) {
            $params.Body = ($body | ConvertTo-Json -Depth 10)
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
        Write-Host "        >> $errMsg" -ForegroundColor DarkRed
        $script:FAIL++
        return $null
    }
}

function Show-Json($label, $obj) {
    Write-Host ""
    Write-Host "  --- $label ---" -ForegroundColor DarkYellow
    Write-Host ($obj | ConvertTo-Json -Depth 6) -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=============================================="
Write-Host "  SQUAD PAYMENT GATEWAY -- Full Route Test"
Write-Host "=============================================="
Write-Host ""

# ── STEP 1: Setup — Register + Login ──────────────────────────
Write-Host "-- STEP 1: Auth Setup -------------------------"
$phone = "070$(Get-Random -Minimum 10000000 -Maximum 99999999)"
$reg = Test-API "Register agent (fresh)" POST "$BASE/api/auth/register" @{
    name = "Payment Tester"; phone = $phone; password = "testpass123"; role = "agent"
}
$TOKEN = $reg.data.token
if (-not $TOKEN) {
    # Fallback — try login with existing
    $login = Test-API "Login fallback" POST "$BASE/api/auth/login" @{
        phone = "08012345678"; password = "password123"
    }
    $TOKEN = $login.data.token
}
if (-not $TOKEN) { Write-Host "No token. Exiting." -ForegroundColor Red; exit 1 }
$AUTH = @{ Authorization = "Bearer $TOKEN" }
Write-Host "  Token acquired." -ForegroundColor DarkGray

# ── STEP 2: Create Profile ─────────────────────────────────────
Write-Host ""
Write-Host "-- STEP 2: Create Test Profile ----------------"
$profile = Test-API "Create trader profile (Amina)" POST "$BASE/api/profiles" @{
    fullName      = "Amina Bello"
    phone         = "08123456789"
    type          = "trader"
    channel       = "whatsapp"
    language      = "hausa"
    location      = "Kano"
    trade         = "vegetables"
    skills        = @("sales", "retail", "food")
    bio           = "I sell tomatoes and peppers at Dawanau market"
    monthlyIncome = 60000
    trustSignals  = @{ communityEndorsed = $true; marketRegistered = $true; yearsActive = 3 }
} $AUTH

$PID = $profile.data.id
Write-Host "  Profile ID: $PID" -ForegroundColor DarkGray
Show-Json "Profile created" $profile.data

# ── STEP 3: Virtual Account Routes ────────────────────────────
Write-Host ""
Write-Host "-- STEP 3: Virtual Account (Squad Mock) ------"

$va = Test-API "Create virtual account — no BVN (mock)" POST "$BASE/api/payments/virtual-accounts/$PID" @{
    email = "amina.bello@example.com"
} $AUTH
if ($va) { Show-Json "Virtual Account" $va.data }

# Test with full BVN payload (still mock because SQUAD_MOCK=true)
$va2 = Test-API "Create virtual account — full BVN payload (mock)" POST "$BASE/api/payments/virtual-accounts/$PID" @{
    bvn                = "22190865037"
    dob                = "1994-03-22"
    email              = "amina.bello@example.com"
    gender             = "2"
    address            = "15 Dawanau Road, Kano"
    beneficiaryAccount = "0123456789"
} $AUTH
if ($va2) { Show-Json "Virtual Account (BVN payload)" $va2.data }

# ── STEP 4: Simulate Payments ──────────────────────────────────
Write-Host ""
Write-Host "-- STEP 4: Simulate Payments (Squad Transactions) --"

$payments = @(
    @{ ref = "SQ_TXN_20240516_001"; amount = 25000; channel = "squad_virtual_account"; note = "Market sales day 1" }
    @{ ref = "SQ_TXN_20240516_002"; amount = 18500; channel = "squad_transfer";         note = "Wholesale payment" }
    @{ ref = "SQ_TXN_20240516_003"; amount = 32000; channel = "squad_virtual_account"; note = "Bulk tomato sale" }
    @{ ref = "SQ_TXN_20240516_004"; amount = 9500;  channel = "squad_pos";              note = "Small retail" }
    @{ ref = "SQ_TXN_20240516_005"; amount = 45000; channel = "squad_virtual_account"; note = "Festival stock sale" }
)

$totalPaid = 0
foreach ($p in $payments) {
    $r = Test-API "Payment [$($p.ref)] — N$($p.amount) via $($p.channel)" POST "$BASE/api/payments/simulate" @{
        profileId     = $PID
        amount        = $p.amount
        channel       = $p.channel
        status        = "success"
        reference     = $p.ref
        transaction_ref = $p.ref
    } $AUTH
    if ($r) { $totalPaid += $p.amount }
}
Write-Host "  Total simulated: N$totalPaid across $($payments.Count) transactions" -ForegroundColor Cyan

# Test failed payment status
$rf = Test-API "Simulate FAILED payment (status=failed)" POST "$BASE/api/payments/simulate" @{
    profileId   = $PID
    amount      = 5000
    channel     = "squad_virtual_account"
    status      = "failed"
    reference   = "SQ_FAIL_001"
} $AUTH

# Validation error — missing amount
$v1 = Test-API "Missing amount field (expect 422)" POST "$BASE/api/payments/simulate" @{
    profileId = $PID
    channel   = "squad_virtual_account"
} $AUTH

# Validation error — negative amount
$v2 = Test-API "Negative amount (expect 422)" POST "$BASE/api/payments/simulate" @{
    profileId = $PID
    amount    = -5000
    channel   = "squad_virtual_account"
} $AUTH

# ── STEP 5: List Payments ──────────────────────────────────────
Write-Host ""
Write-Host "-- STEP 5: List All Payments ------------------"
$allPay = Test-API "GET /api/payments — list all" GET "$BASE/api/payments" $null $AUTH
if ($allPay) {
    Write-Host "  Total payments recorded: $($allPay.data.Count)" -ForegroundColor Cyan
    foreach ($p in $allPay.data) {
        $status = $p.status
        $color = if ($status -eq "success") { "Green" } else { "Red" }
        Write-Host "  [$($p.id)]  N$($p.amount)  $($p.channel)  status=$status" -ForegroundColor $color
    }
}

# ── STEP 6: Squad Webhooks ─────────────────────────────────────
Write-Host ""
Write-Host "-- STEP 6: Squad Webhook Events ---------------"

# Standard Squad webhook (nested data format)
$wh1 = Test-API "Webhook: transaction.successful (nested)" POST "$BASE/api/webhooks/squad" @{
    event = "transaction.successful"
    data  = @{
        transaction_ref    = "SQ_WEBHOOK_001"
        amount             = 50000
        principal_amount   = 50000
        transaction_status = "success"
        customer_identifier = $PID
        currency           = "NGN"
        transaction_type   = "credit"
        meta               = @{ description = "Market sale via Squad virtual account" }
    }
}
if ($wh1) { Show-Json "Webhook result" $wh1.data }

# Squad webhook flat format
$wh2 = Test-API "Webhook: flat payload format" POST "$BASE/api/webhooks/squad" @{
    transaction_ref     = "SQ_WEBHOOK_002"
    amount              = 15000
    status              = "success"
    customer_identifier = $PID
    currency            = "NGN"
}

# Squad webhook — different profile
$wh3 = Test-API "Webhook: unknown profile_id (still recorded)" POST "$BASE/api/webhooks/squad" @{
    data = @{
        transaction_ref     = "SQ_WEBHOOK_003"
        amount              = 8000
        transaction_status  = "success"
        customer_identifier = "eco_unknown_profile"
    }
}

# ── STEP 7: Score BEFORE vs AFTER payments ────────────────────
Write-Host ""
Write-Host "-- STEP 7: Economic Score (post-payments) -----"
$score = Test-API "GET /api/scores/$PID" GET "$BASE/api/scores/$PID" $null $AUTH
if ($score) {
    $s = $score.data
    Write-Host ""
    Write-Host "  ============================================" -ForegroundColor Cyan
    Write-Host "  ECONOMIC PASSPORT SCORE" -ForegroundColor Cyan
    Write-Host "  ============================================" -ForegroundColor Cyan
    Write-Host "  Profile  : $($profile.data.fullName)" -ForegroundColor White
    Write-Host "  Score    : $($s.score) / 100" -ForegroundColor $(if ($s.score -ge 75) { "Green" } elseif ($s.score -ge 50) { "Yellow" } else { "Red" })
    Write-Host "  Band     : $($s.band)" -ForegroundColor Cyan
    Write-Host "  CreditLim: N$($s.suggestedLimit)" -ForegroundColor Green
    Write-Host "  -------- Signal Breakdown --------" -ForegroundColor DarkYellow
    Write-Host "  Income score    : $($s.signals.incomeScore)" -ForegroundColor DarkGray
    Write-Host "  Skill score     : $($s.signals.skillScore)" -ForegroundColor DarkGray
    Write-Host "  Transaction scr : $($s.signals.transactionScore)" -ForegroundColor DarkGray
    Write-Host "  Trust score     : $($s.signals.trustScore)" -ForegroundColor DarkGray
    Write-Host "  Channel score   : $($s.signals.channelScore)" -ForegroundColor DarkGray
    Write-Host "  Payment count   : $($s.signals.paymentFrequency)" -ForegroundColor DarkGray
    Write-Host "  Total pay value : N$($s.signals.totalPaymentValue)" -ForegroundColor DarkGray
    Write-Host "  ============================================" -ForegroundColor Cyan
}

# ── STEP 8: Dashboard after all payments ──────────────────────
Write-Host ""
Write-Host "-- STEP 8: Dashboard (after Squad payments) --"
$dash = Test-API "GET /api/dashboard" GET "$BASE/api/dashboard" $null $AUTH
if ($dash) {
    $d = $dash.data
    Write-Host "  Users onboarded  : $($d.usersOnboarded)" -ForegroundColor Cyan
    Write-Host "  Payment volume   : N$($d.paymentVolume)" -ForegroundColor Cyan
    Write-Host "  Payment count    : $($d.paymentCount)" -ForegroundColor Cyan
    Write-Host "  Credit ready     : $($d.creditReady)" -ForegroundColor Cyan
    Write-Host "  By location      : $($d.byLocation | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    Write-Host "  By type          : $($d.byType | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    Write-Host "  Activity captured: $($d.economicSignals.informalActivityCaptured)" -ForegroundColor Cyan
    Write-Host "  Jobs matched     : $($d.economicSignals.estimatedJobsMatched)" -ForegroundColor Cyan
    Write-Host "  Credit unlocked  : N$($d.economicSignals.estimatedCreditUnlocked)" -ForegroundColor Cyan
}

# ── SUMMARY ───────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================="
Write-Host "  SQUAD PAYMENT TEST RESULTS"
Write-Host "  PASSED : $PASS"
Write-Host "  FAILED : $FAIL"
Write-Host "  TOTAL  : $($PASS + $FAIL)"
Write-Host "=============================================="
Write-Host ""
