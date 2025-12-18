
$TaskName = "SafeScoreCacheWarmer"
$WorkingDirectory = "C:\Users\THINKPAD\Desktop\safescore"
$LogFile = "$WorkingDirectory\cron.log"
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c cd /d $WorkingDirectory && npm run warm-cache >> $LogFile 2>&1"

# Trigger every 12 hours
$Trigger = New-ScheduledTaskTrigger -Daily -At 3:00AM
$Trigger.Repetition = (New-ScheduledTaskRepetition -Interval (New-TimeSpan -Hours 12) -Duration (New-TimeSpan -Days 1))

$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

Write-Host "Registering Scheduled Task: $TaskName..." -ForegroundColor Cyan

try {
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Force -ErrorAction Stop
    Write-Host "✅ Success! SafeScore will now update its cache every 12 hours." -ForegroundColor Green
    Write-Host "You can check progress in: $LogFile" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to register task. Please make sure you run this script as Administrator." -ForegroundColor Red
}
