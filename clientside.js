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

            // Step 4: Ready - Show clean interface with copy button
            updateStep(4);
            statusText.textContent = 'Ready!';
            
            await sleep(500);
            updateStep(4, true);
            
            spinner.style.display = 'none';

            // Create a clean, simple interface
            statusText.innerHTML = `
                <div style="margin: 30px 0;">
                    <div style="background: rgba(255, 119, 0, 0.1); border: 2px solid #ff7700; 
                                border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; 
                                    letter-spacing: 1px; margin-bottom: 10px; font-weight: 600;">
                            Your VIN
                        </div>
                        <div style="color: #ff7700; font-family: 'Courier New', monospace; 
                                    font-size: 24px; font-weight: bold; letter-spacing: 3px; 
                                    margin-bottom: 15px; word-break: break-all;">
                            ${vin}
                        </div>
                        <button id="copy-btn" style="
                            background: #ff7700;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            width: 100%;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        " onmouseover="this.style.background='#ff8800'" 
                           onmouseout="this.style.background='#ff7700'">
                            📋 Copy VIN to Clipboard
                        </button>
                    </div>
                    
                    <button id="autozone-btn" style="
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                        color: white;
                        border: 2px solid rgba(255, 119, 0, 0.5);
                        padding: 15px 30px;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s;
                        width: 100%;
                        margin-top: 10px;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(255,119,0,0.3)'" 
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        🚗 Open AutoZone VIN Decoder →
                    </button>
                    
                    <div style="margin-top: 20px; padding: 15px; background: rgba(34, 197, 94, 0.1); 
                                border-left: 3px solid #22c55e; border-radius: 6px;">
                        <div style="color: #22c55e; font-size: 13px; line-height: 1.6;">
                            <strong>Quick Steps:</strong><br>
                            1. Click "Copy VIN" above<br>
                            2. Click "Open AutoZone"<br>
                            3. Paste (Ctrl+V) into the VIN field<br>
                            4. Click "Find Vehicle"
                        </div>
                    </div>
                </div>
            `;

            // Add copy functionality
            const copyBtn = document.getElementById('copy-btn');
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(vin);
                    copyBtn.textContent = '✓ Copied!';
                    copyBtn.style.background = '#22c55e';
                    setTimeout(() => {
                        copyBtn.textContent = '📋 Copy VIN to Clipboard';
                        copyBtn.style.background = '#ff7700';
                    }, 2000);
                } catch (e) {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = vin;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    
                    copyBtn.textContent = '✓ Copied!';
                    copyBtn.style.background = '#22c55e';
                    setTimeout(() => {
                        copyBtn.textContent = '📋 Copy VIN to Clipboard';
                        copyBtn.style.background = '#ff7700';
                    }, 2000);
                }
            });

            // Add AutoZone button functionality
            const autoZoneBtn = document.getElementById('autozone-btn');
            autoZoneBtn.addEventListener('click', () => {
                window.open('https://www.autozone.com/vin-decoder', '_blank');
            });

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
