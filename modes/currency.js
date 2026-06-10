class CurrencyCalculator {
    constructor() {
        this.amountInput = document.getElementById('curr-amount');
        this.fromSelect = document.getElementById('curr-from');
        this.toSelect = document.getElementById('curr-to');
        this.resultDisplay = document.getElementById('curr-result');
        this.rateTextDisplay = document.getElementById('curr-rate-text');
        this.swapBtn = document.getElementById('curr-swap');

        this.rates = {}; 
        
        this.attachListeners();
        this.fetchLiveRates();
    }

    async fetchLiveRates() {
        try {
            this.rateTextDisplay.innerText = "Fetching live rates...";
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            
            if(data && data.rates) {
                this.rates = data.rates;
                this.calculate();
            } else {
                throw new Error("Invalid API Response");
            }
        } catch (error) {
            console.error("Error fetching rates:", error);
            this.rateTextDisplay.innerText = "Error: Could not load live rates.";
            this.resultDisplay.innerText = "0.00";
        }
    }

    attachListeners() {
        // Standard input triggers
        this.amountInput.addEventListener('input', () => this.calculate());
        this.fromSelect.addEventListener('change', () => this.calculate());
        this.toSelect.addEventListener('change', () => this.calculate());

        // Swap Button Logic
        this.swapBtn.addEventListener('click', () => {
            const temp = this.fromSelect.value;
            this.fromSelect.value = this.toSelect.value;
            this.toSelect.value = temp;
            
            this.swapBtn.style.transform = `rotate(180deg)`;
            setTimeout(() => this.swapBtn.style.transform = `rotate(0deg)`, 300);

            this.calculate();
        });

        // --- 1. Attach Smart Dropdown Typing Responders ---
        this.setupSmartDropdown(this.fromSelect);
        this.setupSmartDropdown(this.toSelect);

        // --- 2. Attach Global Hotkeys for Currency Mode ---
        document.addEventListener('keydown', (e) => {
            const currContainer = document.getElementById('currency-mode');
            if (!currContainer || !currContainer.classList.contains('active')) return;

            // Allow normal number typing in the amount field without triggering shortcuts
            if (document.activeElement === this.amountInput && /^[0-9.]$/.test(e.key)) return;

            const key = e.key.toLowerCase();
            
            // Global Jump Shortcuts
            if (key === 'f') { e.preventDefault(); this.fromSelect.focus(); } // Jump to Drop1
            if (key === 't') { e.preventDefault(); this.toSelect.focus(); }   // Jump to Drop2
            if (key === 'a') { e.preventDefault(); this.amountInput.focus(); } // Jump to Amount
            if (key === 's') { e.preventDefault(); this.swapBtn.click(); }     // Trigger Swap
        });
    }

    // --- Core Feature: 2-Digit Key Buffer Algorithm ---
    setupSmartDropdown(selectElement) {
        let keyBuffer = '';
        let timeout;

        selectElement.addEventListener('keydown', (e) => {
            // Ignore system navigation keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab', 'Escape'].includes(e.key)) return;
            
            // Intercept Alphabet keystrokes
            if (/^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault(); // Stop native browser jump behavior
                
                keyBuffer += e.key.toUpperCase(); // Add to buffer (e.g., 'U', then 'S')
                
                // Clear buffer after 800ms of inactivity
                clearTimeout(timeout);
                timeout = setTimeout(() => { keyBuffer = ''; }, 800); 

                // Search options for a strict match on the 2-digit prefix (e.g., "US")
                const options = Array.from(selectElement.options);
                const match = options.find(opt => opt.text.trim().startsWith(keyBuffer));

                if (match) {
                    selectElement.value = match.value;
                    this.calculate(); // Instantly calculate on successful match
                }

                // If user typed 2 characters, reset buffer immediately for next rapid entry
                if (keyBuffer.length === 2) {
                    keyBuffer = ''; 
                }
            }
        });
    }

    calculate() {
        if (Object.keys(this.rates).length === 0) return; 

        const fromCurrency = this.fromSelect.value;
        const toCurrency = this.toSelect.value;
        const amount = parseFloat(this.amountInput.value) || 0;

        const fromRate = this.rates[fromCurrency];
        const toRate = this.rates[toCurrency];
        
        const rawResult = (amount / fromRate) * toRate;
        const singleUnitRate = (1 / fromRate) * toRate;

        this.resultDisplay.innerText = rawResult.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });

        this.rateTextDisplay.innerText = `1 ${fromCurrency} = ${singleUnitRate.toFixed(4)} ${toCurrency}`;
    }
}

// Inject HTML and Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const currContainer = document.getElementById('currency-mode');
    if (!currContainer) return;

    const currencyList = [
        { code: 'USD', name: 'US Dollar', prefix: 'US' },
        { code: 'EUR', name: 'Euro', prefix: 'EU' },
        { code: 'GBP', name: 'British Pound', prefix: 'GB' },
        { code: 'INR', name: 'Indian Rupee', prefix: 'IN' },
        { code: 'JPY', name: 'Japanese Yen', prefix: 'JP' },
        { code: 'AUD', name: 'Australian Dollar', prefix: 'AU' },
        { code: 'CAD', name: 'Canadian Dollar', prefix: 'CA' },
        { code: 'CHF', name: 'Swiss Franc', prefix: 'CH' },
        { code: 'CNY', name: 'Chinese Yuan', prefix: 'CN' },
        { code: 'SGD', name: 'Singapore Dollar', prefix: 'SG' },
        { code: 'AED', name: 'UAE Dirham', prefix: 'AE' },
        { code: 'MXN', name: 'Mexican Peso', prefix: 'MX' },
        { code: 'BRL', name: 'Brazilian Real', prefix: 'BR' },
        { code: 'ZAR', name: 'South African Rand', prefix: 'ZA' },
        { code: 'KRW', name: 'South Korean Won', prefix: 'KR' }
    ];

    const generateOptions = (selectedCode) => {
        return currencyList.map(c => 
            `<option value="${c.code}" ${c.code === selectedCode ? 'selected' : ''}>
                ${c.prefix} \u00A0\u00A0 ${c.code} - ${c.name}
            </option>`
        ).join('');
    };

    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
        .currency-scroll-wrapper { max-height: 70vh; overflow-y: auto; padding: 0 5px; }
        .currency-scroll-wrapper::-webkit-scrollbar { width: 6px; }
        .currency-scroll-wrapper::-webkit-scrollbar-thumb { background: var(--nav-text-inactive); border-radius: 10px; }
        
        .result-card { background-color: var(--btn-num-bg); border-radius: 16px; padding: 20px; }
        
        .custom-curr-select, .custom-curr-input {
            background-color: transparent !important;
            color: var(--text-primary) !important;
            border: none;
            padding-left: 0;
            box-shadow: none !important;
        }
        .custom-curr-select { font-weight: 600; cursor: pointer; border-bottom: 1px solid var(--nav-bg); border-radius: 0; }
        .custom-curr-input { font-size: 1.5rem; font-weight: 500; }
        .custom-curr-input::placeholder { color: var(--text-secondary); opacity: 0.5; }
        
        .swap-container {
            display: flex;
            justify-content: center;
            margin-top: -24px;
            margin-bottom: -24px;
            position: relative;
            z-index: 10;
        }
        .swap-btn-custom {
            width: 44px; height: 44px;
            background-color: var(--btn-accent-bg);
            color: white; border: none; border-radius: 50%;
            display: flex; justify-content: center; align-items: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, filter 0.2s ease;
        }
        .swap-btn-custom:active { filter: brightness(0.8); }
    `;
    document.head.appendChild(styleBlock);

    currContainer.innerHTML = `
        <div class="currency-scroll-wrapper w-100 pb-4">
            <div class="result-card text-start shadow-sm">
                <label class="form-label small text-secondary fw-semibold mb-1">From</label>
                <select id="curr-from" class="form-select form-select-lg custom-curr-select mb-2">
                    ${generateOptions('USD')}
                </select>
                <input type="number" id="curr-amount" class="form-control form-control-lg custom-curr-input" placeholder="0.00" value="100">
            </div>

            <div class="swap-container">
                <button id="curr-swap" class="swap-btn-custom cursor-pointer">
                    <i class="bi bi-arrow-down-up fs-5"></i>
                </button>
            </div>

            <div class="result-card text-start mb-4 shadow-sm pt-4">
                <label class="form-label small text-secondary fw-semibold mb-1 mt-2">To</label>
                <select id="curr-to" class="form-select form-select-lg custom-curr-select mb-2">
                    ${generateOptions('EUR')}
                </select>
                <div id="curr-result" class="display-4 fw-medium text-body mt-2 text-break">0.00</div>
            </div>

            <div class="result-card text-center shadow-sm">
                <div class="text-secondary small mb-1">Exchange Rate</div>
                <div id="curr-rate-text" class="fs-5 fw-bold text-body">Fetching...</div>
                <div class="small text-secondary mt-2" style="font-size: 0.75rem;">Rates updated dynamically via Open Exchange API</div>
            </div>
        </div>
    `;

    new CurrencyCalculator();

    const calculatorContainer = document.querySelector('.calculator-container');
    const keypadArea = document.getElementById('keypad-area');
    
    const observer = new MutationObserver(() => {
        if (currContainer.classList.contains('active')) {
            calculatorContainer.classList.add('hide-display-area');
            keypadArea.classList.replace('flex-shrink-0', 'flex-grow-1');
        } else if (!document.getElementById('loan-mode').classList.contains('active')) {
            calculatorContainer.classList.remove('hide-display-area');
            keypadArea.classList.replace('flex-grow-1', 'flex-shrink-0');
        }
    });
    observer.observe(currContainer, { attributes: true, attributeFilter: ['class'] });
});