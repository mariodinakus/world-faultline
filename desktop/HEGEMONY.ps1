# HEGEMONY Desktop — Windows
# Run with Windows PowerShell 5.1 (not PowerShell Core).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$base = 'https://hegemony-world-power.vercel.app'
$dir = Join-Path $env:LOCALAPPDATA 'HEGEMONY'
New-Item -ItemType Directory -Force $dir | Out-Null
$stateFile = Join-Path $dir 'state.json'
$log = Join-Path $dir 'alerts.log'
$mutex = New-Object Threading.Mutex($false,'Local\HegemonyDesktop')
if (!$mutex.WaitOne(0)) { exit }
$state = @{}
if (Test-Path $stateFile) { try { (Get-Content $stateFile -Raw | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $state[$_.Name] = $_.Value } } catch {} }
$tray = New-Object Windows.Forms.NotifyIcon
$tray.Icon = [Drawing.SystemIcons]::Information
$tray.Text = 'HEGEMONY Intelligence'
$tray.Visible = $true
$menu = New-Object Windows.Forms.ContextMenuStrip
$open = $menu.Items.Add('Open HEGEMONY')
$open.add_Click({ Start-Process $base })
$tray.add_DoubleClick({ Start-Process $base })
$history = $menu.Items.Add('Alert history')
$history.add_Click({ if (!(Test-Path $log)) { New-Item -ItemType File $log | Out-Null }; Start-Process notepad.exe $log })
$startup = $menu.Items.Add('Start with Windows')
$startupPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'HEGEMONY.lnk'
$startup.Checked = Test-Path $startupPath
$startup.add_Click({
 if (Test-Path $startupPath) { Remove-Item $startupPath; $startup.Checked = $false }
 else { $link = (New-Object -ComObject WScript.Shell).CreateShortcut($startupPath); $link.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"; $link.Arguments = '-NoProfile -WindowStyle Hidden -File "' + $script:scriptPath + '"'; $link.Save(); $startup.Checked = $true }
})
$script:scriptPath = $PSCommandPath
$quit = $menu.Items.Add('Exit')
$quit.add_Click({ [Windows.Forms.Application]::Exit() })
$tray.ContextMenuStrip = $menu
$worker = [PowerShell]::Create()
$job = $null
$poll = {
 param($base)
 $out = @{}
 try { $g = Invoke-RestMethod "$base/api/geo" -TimeoutSec 55
  if ($null -ne $g.escalation.value -and $g.escalation.coverage -ge 0.75) { $out['Escalation index'] = [double]$g.escalation.value }
  if ($null -ne $g.brent.last.value) { $out['Brent USD'] = [double]$g.brent.last.value }
  foreach ($n in $g.news) { if ($n.id -and $null -ne $n.ratio) { $out["Attention ratio: $($n.id)"] = [double]$n.ratio } }
 } catch {}
 try { $r = Invoke-RestMethod "$base/api/radar" -TimeoutSec 60
  foreach ($key in @('p','stress','g20','diff')) { if ($null -ne $r.current.$key) { $out["Macro $key"] = [double]$r.current.$key } }
  foreach ($c in $r.countries) { if ($c.iso3 -and $c.level -and $c.level -ne 'n/a') { $out["Country risk: $($c.iso3)"] = [string]$c.level } }
 } catch {}
 return $out
}
function Start-Poll { if ($null -eq $script:job) { $worker.Commands.Clear(); [void]$worker.AddScript($poll.ToString()).AddArgument($base); $script:job = $worker.BeginInvoke(); $tray.Text = 'HEGEMONY - checking sources' } }
$check = $menu.Items.Add('Check now')
$check.add_Click({ Start-Poll })
$timer = New-Object Windows.Forms.Timer
$timer.Interval = 300000
$timer.add_Tick({ Start-Poll })
$collect = New-Object Windows.Forms.Timer
$collect.Interval = 1000
$collect.add_Tick({
 if ($null -eq $script:job -or !$script:job.IsCompleted) { return }
 try {
  $result = $worker.EndInvoke($script:job)
  $changes = @()
  foreach ($batch in $result) {
   foreach ($key in $batch.Keys) {
    $v = $batch[$key]
    if ($state.ContainsKey($key)) {
     $old = $state[$key]
     $changed = if ($v -is [string]) { $v -ne $old } else {
      $limit = switch -Wildcard ($key) { 'Brent*' { 2 }; 'Attention*' { 0.5 }; 'Macro g20' { 0.2 }; default { 3 } }
      [Math]::Abs([double]$v - [double]$old) -ge $limit
     }
     if ($changed) { $changes += "$key : $old -> $v"; $state[$key] = $v }
    } else { $state[$key] = $v }
   }
  }
  $state | ConvertTo-Json | Set-Content $stateFile -Encoding UTF8
  if ($changes.Count) {
   $changes | ForEach-Object { "$(Get-Date -Format s) $_" } | Add-Content $log -Encoding UTF8
   $tray.ShowBalloonTip(10000,'HEGEMONY | Changes detected',(($changes | Select-Object -First 4) -join "`n"),[Windows.Forms.ToolTipIcon]::Info)
  }
  $tray.Text = if ($result.Count -and $result[0].Count) { 'HEGEMONY - last check ' + (Get-Date -Format HH:mm) } else { 'HEGEMONY - sources unavailable' }
 } catch { $tray.Text = 'HEGEMONY - check failed' } finally { $script:job = $null }
})
$timer.Start(); $collect.Start(); Start-Poll
try { [Windows.Forms.Application]::Run() } finally { $timer.Stop(); $collect.Stop(); $tray.Dispose(); $worker.Dispose(); $mutex.ReleaseMutex(); $mutex.Dispose() }
