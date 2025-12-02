# Script to add custom alert modal to HTML files

$htmlFiles = @(
    "siswa.html",
    "tahfizh.html",
    "tathbiq.html",
    "doa.html",
    "laporan.html",
    "bilqolam.html",
    "dashboard.html"
)

$customAlertModal = @"

    <!-- Custom Alert Modal -->
    <div id="customAlertModal" class="hidden fixed inset-0 z-50 overflow-y-auto" style="backdrop-filter: blur(4px);">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <!-- Background overlay -->
            <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50" onclick="closeCustomAlert()"></div>

            <!-- Center modal -->
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <!-- Alert Box -->
            <div id="alertBox" class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <!-- Icon Container -->
                <div id="alertIconContainer" class="flex items-center justify-center pt-8 pb-4">
                    <div id="alertIcon" class="w-20 h-20 rounded-full flex items-center justify-center">
                        <i id="alertIconElement" class="text-5xl"></i>
                    </div>
                </div>

                <!-- Content -->
                <div class="px-6 pb-6 text-center">
                    <h3 id="alertTitle" class="text-2xl font-bold text-gray-900 dark:text-white mb-2"></h3>
                    <p id="alertMessage" class="text-gray-600 dark:text-gray-400 mb-6"></p>

                    <!-- Buttons Container -->
                    <div id="alertButtons" class="flex gap-3 justify-center">
                        <!-- Buttons will be inserted here -->
                    </div>
                </div>
            </div>
        </div>
    </div>
"@

foreach ($file in $htmlFiles) {
    $filePath = "public\$file"
    
    if (Test-Path $filePath) {
        Write-Host "Processing $file..." -ForegroundColor Cyan
        
        $content = Get-Content $filePath -Raw
        
        # Check if custom alert modal already exists
        if ($content -match "customAlertModal") {
            Write-Host "  ✓ Custom alert modal already exists in $file" -ForegroundColor Yellow
        } else {
            # Add custom alert modal before Firebase SDKs
            $content = $content -replace '(\s*<!-- Firebase SDKs -->)', "$customAlertModal`r`n`$1"
            
            # Add custom-alert.js script before the last script tag
            $content = $content -replace '(\s*<script src="js/\w+\.js"></script>\s*</body>)', "    <script src=`"js/custom-alert.js`"></script>`r`n`$1"
            
            Set-Content $filePath $content -NoNewline
            Write-Host "  ✓ Added custom alert modal to $file" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nDone! Custom alert modal added to all files." -ForegroundColor Green
