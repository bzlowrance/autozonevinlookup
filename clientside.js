// AutoZone VIN Form Auto-Population Script
// This script decodes a VIN and submits it to AutoZone

(function() {
    'use strict';

    // Get VIN from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const vin = (urlParams.get('vin') || urlParams.get('VIN') || '').trim().toUpperCase();

    // DOM elements
    const spinner = document.getElementById('spinner');
    const statusText = document.getElementById('status');
    const vinContainer = document.getElementById('vin-container');
    const vehicleContainer = document.getElementById('vehicle-container');
    const errorContainer = document.getElementById('error-container');

    // Step management
    function updateStep(stepNum, complete = false) {
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`step${i}`);
            if (!step) continue;
            
            step.classList.remove('active', 'complete');
            if (i < stepNum) {
                step.classList.add('complete');
            } else if (i === stepNum) {
                step.classList.add('active');
            }
        }
    }

    function showError(message) {
        spinner.style.display = 'none';
        errorContainer.innerHTML = `
            <div class="error">
                <strong>⚠️ Error</strong><br>
                ${message}
            </div>
        `;
        statusText.textContent = 'Process failed';
    }

    // Main function to decode VIN and redirect
    async function processVIN() {
        if (!vin) {
            showError('No VIN provided. Please add ?vin=YOUR_VIN to the URL.');
            return;
        }

        if (vin.length !== 17) {
            showError(`Invalid VIN length (${vin.length} characters). VIN must be exactly 17 characters.`);
            return;
        }

        try {
            // Step 1: Decode VIN
            updateStep(1);
            statusText.textContent = 'Decoding VIN with NHTSA database...';
            
            vinContainer.innerHTML = `
                <div class="vin-display">
                    <div class="vin-text">${vin}</div>
                </div>
            `;

            const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
            const data = await response.json();

            if (!data.Results) {
                throw new Error('Unable to decode VIN from NHTSA database');
            }

            const results = data.Results;
            const getValue = (name) => {
                const item = results.find(r => r.Variable === name);
                return item ? item.Value : '';
            };

            const year = getValue('Model Year');
            const make = getValue('Make');
            const model = getValue('Model');

            if (year && make && model && year !== 'Not Applicable' && make !== 'Not Applicable') {
                vehicleContainer.innerHTML = `
                    <div class="vehicle-info">
                        ${year} ${make} ${model}
                    </div>
                `;
            }

            await sleep(800);
            updateStep(1, true);

            // Step 2: Prepare AutoZone redirect
            updateStep(2);
            statusText.textContent = 'Preparing AutoZone connection...';
            await sleep(1000);
            updateStep(2, true);

            // Step 3: Create form
            updateStep(3);
            statusText.textContent = 'Creating VIN submission form...';
            
            // Create a hidden form to submit to AutoZone
            const form = document.createElement('form');
            form.method = 'GET';
            form.action = 'https://www.autozone.com/vin-decoder';
            form.target = '_self';
            form.style.display = 'none';

            const vinInput = document.createElement('input');
            vinInput.type = 'hidden';
            vinInput.name = 'vin';
            vinInput.value = vin;
            form.appendChild(vinInput);

            document.body.appendChild(form);
            
            await sleep(800);
            updateStep(3, true);

            // Step 4: Submit to AutoZone
            updateStep(4);
            statusText.textContent = 'Redirecting to AutoZone...';
            
            await sleep(1000);
            updateStep(4, true);
            
            statusText.textContent = 'Opening AutoZone VIN Decoder...';
            spinner.style.display = 'none';

            // Give user a moment to see completion
            await sleep(500);

            // Open AutoZone in a new window that we can control
            statusText.innerHTML = `
                <strong style="color: #22c55e;">Opening AutoZone...</strong><br><br>
                <div style="color: #cbd5e1; font-size: 14px;">
                    Automatically filling in your VIN
                </div>
            `;

            spinner.style.display = 'none';

            await sleep(1000);

            // Open AutoZone with a script that will auto-fill the VIN
            const autoZoneWindow = window.open('about:blank', '_blank');
            
            if (!autoZoneWindow) {
                // Popup blocked
                statusText.innerHTML = `
                    <div style="background: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 8px;">
                        <strong style="color: #ff5555;">⚠️ Popup Blocked</strong><br><br>
                        <div style="color: #cbd5e1; font-size: 14px; margin-bottom: 15px;">
                            Please allow popups for this site, then click the button below.
                        </div>
                        <button onclick="window.open('https://www.autozone.com/vin-decoder?vin=${encodeURIComponent(vin)}', '_blank')" 
                                style="background: #ff7700; color: white; border: none; padding: 12px 24px; 
                                       border-radius: 8px; font-weight: bold; cursor: pointer;">
                            Open AutoZone
                        </button>
                    </div>
                `;
                return;
            }

            // Create an HTML page that will redirect and auto-fill
            autoZoneWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Loading AutoZone...</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                            color: white;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                        }
                        .loader {
                            text-align: center;
                        }
                        .spinner {
                            border: 4px solid rgba(255, 255, 255, 0.1);
                            border-top: 4px solid #ff7700;
                            border-radius: 50%;
                            width: 50px;
                            height: 50px;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 20px;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        h2 { margin: 0 0 10px 0; }
                        p { color: #94a3b8; }
                        .vin {
                            background: rgba(255, 119, 0, 0.2);
                            padding: 10px 20px;
                            border-radius: 8px;
                            margin: 15px 0;
                            font-family: monospace;
                            font-size: 18px;
                            letter-spacing: 2px;
                        }
                    </style>
                </head>
                <body>
                    <div class="loader">
                        <div class="spinner"></div>
                        <h2>Opening AutoZone</h2>
                        <div class="vin">${vin}</div>
                        <p>Please wait...</p>
                    </div>
                    <script>
                        const VIN = '${vin}';
                        
                        // Wait a moment, then redirect
                        setTimeout(() => {
                            // Navigate to AutoZone with VIN in URL
                            window.location.href = 'https://www.autozone.com/vin-decoder?vin=' + encodeURIComponent(VIN);
                            
                            // Try to auto-fill the form after page loads
                            window.addEventListener('load', () => {
                                setTimeout(() => {
                                    try {
                                        // Try to find and fill VIN input field
                                        const vinInputs = [
                                            document.querySelector('input[name="vin"]'),
                                            document.querySelector('input[type="text"][placeholder*="VIN"]'),
                                            document.querySelector('input[id*="vin"]'),
                                            document.querySelector('input.vin-input'),
                                            ...document.querySelectorAll('input[type="text"]')
                                        ].filter(Boolean);
                                        
                                        for (const input of vinInputs) {
                                            if (input && input.offsetParent !== null) {
                                                input.value = VIN;
                                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                                input.dispatchEvent(new Event('change', { bubbles: true }));
                                                
                                                // Try to find and click submit button
                                                const form = input.closest('form');
                                                if (form) {
                                                    const submitBtn = form.querySelector('button[type="submit"]') || 
                                                                     form.querySelector('input[type="submit"]') ||
                                                                     form.querySelector('button');
                                                    if (submitBtn) {
                                                        setTimeout(() => submitBtn.click(), 500);
                                                    }
                                                }
                                                break;
                                            }
                                        }
                                    } catch (e) {
                                        console.error('Could not auto-fill VIN:', e);
                                    }
                                }, 2000);
                            });
                        }, 1500);
                    </script>
                </body>
                </html>
            `);
            autoZoneWindow.document.close();

            // Update our page
            statusText.innerHTML = `
                <div style="color: #22c55e; margin-top: 20px;">
                    ✓ AutoZone opened in new window<br>
                    <span style="color: #94a3b8; font-size: 14px;">
                        VIN should auto-fill automatically
                    </span>
                </div>
            `;

            return;

        } catch (error) {
            console.error('Error processing VIN:', error);
            showError(`
                Failed to process VIN: ${error.message}<br><br>
                <strong>VIN:</strong> ${vin}<br><br>
                <a href="https://www.autozone.com/vin-decoder" 
                   style="color: #ff7700; font-weight: bold; text-decoration: none;"
                   target="_blank">
                   → Click here to manually enter VIN at AutoZone
                </a>
            `);
        }
    }

    // Utility function for delays
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Start processing when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processVIN);
    } else {
        processVIN();
    }

})();
