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

            // Redirect to AutoZone with VIN parameter
            window.location.href = `https://www.autozone.com/vin-decoder?vin=${encodeURIComponent(vin)}`;

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
