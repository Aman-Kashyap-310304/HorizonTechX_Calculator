class LoanCalculator {
    constructor() {
        // Form Inputs
        this.amountInput = document.getElementById('loan-amount');
        this.rateInput = document.getElementById('loan-rate');
        this.tenureInput = document.getElementById('loan-tenure');
        
        // Toggle Buttons
        this.btnMonths = document.getElementById('btn-months');
        this.btnYears = document.getElementById('btn-years');
        this.isYears = false; // Default to months

        // Output Displays
        this.emiDisplay = document.getElementById('loan-emi');
        this.totalInterestDisplay = document.getElementById('loan-total-interest');
        this.totalPaymentDisplay = document.getElementById('loan-total-payment');
        
        // Progress Bar
        this.progressBarPrincipal = document.getElementById('bar-principal');
        this.progressBarInterest = document.getElementById('bar-interest');
        this.labelPrincipal = document.getElementById('label-principal');
        this.labelInterest = document.getElementById('label-interest');

        this.attachListeners();
        this.calculate(); // Initial blank calc
    }

    attachListeners() {
        const inputs = [this.amountInput, this.rateInput, this.tenureInput];
        inputs.forEach(input => {
            input.addEventListener('input', () => this.calculate());
        });

        this.btnMonths.addEventListener('click', () => {
            this.isYears = false;
            this.updateToggleUI();
            this.calculate();
        });

        this.btnYears.addEventListener('click', () => {
            this.isYears = true;
            this.updateToggleUI();
            this.calculate();
        });
    }

    updateToggleUI() {
        if (this.isYears) {
            this.btnYears.classList.replace('btn-dark-custom', 'btn-accent-custom');
            this.btnMonths.classList.replace('btn-accent-custom', 'btn-dark-custom');
        } else {
            this.btnMonths.classList.replace('btn-dark-custom', 'btn-accent-custom');
            this.btnYears.classList.replace('btn-accent-custom', 'btn-dark-custom');
        }
    }

    formatCurrency(number) {
        if (!isFinite(number) || isNaN(number)) return '₹0';
        
        const rounded = Math.round(number);
        
        // Enterprise UI Protection: Implement 'e' logic for strings exceeding 14 digits
        if (rounded.toString().length > 14) {
            return '₹' + number.toExponential(4); // e.g., ₹1.4700e+21
        }
        
        return '₹' + rounded.toLocaleString('en-IN');
    }

    // Dynamic Font Scaling Logic
    applyDynamicFontSize(element, textLength, isPrimary) {
        // Clear previous dynamic classes
        element.classList.remove('text-scale-large', 'text-scale-medium', 'text-scale-small', 'text-scale-primary-large', 'text-scale-primary-medium', 'text-scale-primary-small');
        
        if (isPrimary) {
            // Sizing for the main EMI display
            if (textLength > 15) {
                element.classList.add('text-scale-primary-small');
            } else if (textLength > 10) {
                element.classList.add('text-scale-primary-medium');
            } else {
                element.classList.add('text-scale-primary-large');
            }
        } else {
            // Sizing for the secondary grid displays (Total Interest / Payment)
            if (textLength > 15) {
                element.classList.add('text-scale-small');
            } else if (textLength > 11) {
                element.classList.add('text-scale-medium');
            } else {
                element.classList.add('text-scale-large');
            }
        }
    }

    calculate() {
        const principal = parseFloat(this.amountInput.value) || 0;
        const annualRate = parseFloat(this.rateInput.value) || 0;
        let months = parseInt(this.tenureInput.value) || 0;

        if (this.isYears) {
            months = months * 12;
        }

        let emi = 0;
        let totalPayment = 0;
        let totalInterest = 0;

        if (principal > 0 && months > 0) {
            if (annualRate > 0) {
                const monthlyRate = annualRate / 12 / 100;
                const compoundFactor = Math.pow(1 + monthlyRate, months);
                
                // UX Protection: Handle JS Infinity limits for massive tenures
                if (compoundFactor === Infinity) {
                    emi = principal * monthlyRate; // Converges to interest-only
                } else {
                    emi = principal * monthlyRate * compoundFactor / (compoundFactor - 1);
                }
            } else {
                emi = principal / months; 
            }
            totalPayment = emi * months;
            totalInterest = totalPayment - principal;
        }

        // Format to strings (Will trigger 'e' logic if > 14 digits)
        const strEmi = this.formatCurrency(emi);
        const strInterest = this.formatCurrency(totalInterest);
        const strPayment = this.formatCurrency(totalPayment);

        // Update DOM Text
        this.emiDisplay.innerText = strEmi;
        this.totalInterestDisplay.innerText = strInterest;
        this.totalPaymentDisplay.innerText = strPayment;
        this.labelPrincipal.innerText = `Principal: ${this.formatCurrency(principal)}`;
        this.labelInterest.innerText = `Interest: ${this.formatCurrency(totalInterest)}`;

        // Autonomously scale font size based on string length to prevent UI breakage
        this.applyDynamicFontSize(this.emiDisplay, strEmi.length, true);
        this.applyDynamicFontSize(this.totalInterestDisplay, strInterest.length, false);
        this.applyDynamicFontSize(this.totalPaymentDisplay, strPayment.length, false);

        // Update Visual Progress Bar
        if (totalPayment > 0) {
            const principalPercent = (principal / totalPayment) * 100;
            const interestPercent = (totalInterest / totalPayment) * 100;
            
            this.progressBarPrincipal.style.width = `${principalPercent}%`;
            this.progressBarInterest.style.width = `${interestPercent}%`;
        } else {
            this.progressBarPrincipal.style.width = `100%`;
            this.progressBarInterest.style.width = `0%`;
        }
    }
}

// Inject HTML and Initialize
document.addEventListener('DOMContentLoaded', () => {
    const loanContainer = document.getElementById('loan-mode');
    if (!loanContainer) return;

    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
        /* Dynamic form hiding */
        .hide-display-area .display-area { display: none !important; }
        .loan-scroll-wrapper { max-height: 70vh; overflow-y: auto; padding-right: 5px; }
        .loan-scroll-wrapper::-webkit-scrollbar { width: 6px; }
        .loan-scroll-wrapper::-webkit-scrollbar-thumb { background: var(--nav-text-inactive); border-radius: 10px; }
        
        /* Logical Contrast Fix for Inputs */
        .custom-loan-input {
            background-color: var(--btn-num-bg) !important;
            color: var(--btn-num-text) !important;
            border: 1px solid transparent;
        }
        .custom-loan-input:focus {
            border-color: var(--btn-accent-bg);
            box-shadow: 0 0 0 0.2rem rgba(251, 169, 25, 0.25);
        }
        
        /* Custom Buttons */
        .btn-accent-custom { background-color: var(--btn-accent-bg) !important; color: white !important; border: none; }
        .btn-dark-custom { background-color: var(--btn-num-bg) !important; color: var(--text-secondary) !important; border: none; }
        
        /* Result Cards & UI Protections */
        .result-card { background-color: var(--btn-num-bg); border-radius: 16px; padding: 20px; }
        
        /* Seamless Horizontal Scroll for Massive Numbers */
        .overflow-protect {
            overflow-x: auto;
            white-space: nowrap;
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        .overflow-protect::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
        }

        /* Dynamic Font Scaling Classes */
        .text-scale-primary-large { font-size: 2.5rem; transition: font-size 0.2s ease; }
        .text-scale-primary-medium { font-size: 1.8rem; transition: font-size 0.2s ease; }
        .text-scale-primary-small { font-size: 1.4rem; transition: font-size 0.2s ease; }
        
        .text-scale-large { font-size: 1.5rem; transition: font-size 0.2s ease; }
        .text-scale-medium { font-size: 1.1rem; transition: font-size 0.2s ease; }
        .text-scale-small { font-size: 0.9rem; transition: font-size 0.2s ease; }

        .progress-bar-custom { height: 12px; border-radius: 10px; display: flex; overflow: hidden; margin-bottom: 12px; }
        .bg-principal { background-color: var(--btn-accent-bg); }
        .bg-interest { background-color: #ff6b6b; }
        .dot-principal { color: var(--btn-accent-bg); }
        .dot-interest { color: #ff6b6b; }
    `;
    document.head.appendChild(styleBlock);

    loanContainer.innerHTML = `
        <div class="loan-scroll-wrapper w-100 pb-4">
            <div class="mb-3 text-start">
                <label class="form-label small text-secondary fw-semibold mb-1">Loan Amount</label>
                <input type="number" id="loan-amount" class="form-control form-control-lg custom-loan-input">
            </div>
            
            <div class="mb-3 text-start">
                <label class="form-label small text-secondary fw-semibold mb-1">Interest Rate (% per annum)</label>
                <input type="number" id="loan-rate" step="0.1" class="form-control form-control-lg custom-loan-input">
            </div>
            
            <div class="mb-4 text-start">
                <label class="form-label small text-secondary fw-semibold mb-1">Tenure</label>
                <div class="d-flex gap-2">
                    <input type="number" id="loan-tenure" class="form-control form-control-lg custom-loan-input w-50">
                    <div class="btn-group w-50" role="group">
                        <button type="button" id="btn-months" class="btn btn-accent-custom fw-semibold">Months</button>
                        <button type="button" id="btn-years" class="btn btn-dark-custom fw-semibold">Years</button>
                    </div>
                </div>
            </div>

            <div class="result-card text-start mb-3 shadow-sm overflow-protect">
                <div class="text-secondary small mb-1">Monthly EMI</div>
                <div class="fw-bold lh-1 text-body text-scale-primary-large" id="loan-emi">₹0</div>
            </div>

            <div class="row g-3 mb-3">
                <div class="col-6">
                    <div class="result-card text-start h-100 shadow-sm overflow-protect">
                        <div class="text-secondary small mb-1">Total Interest</div>
                        <div class="fw-bold text-body text-scale-large" id="loan-total-interest">₹0</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="result-card text-start h-100 shadow-sm overflow-protect">
                        <div class="text-secondary small mb-1">Total Payment</div>
                        <div class="fw-bold text-body text-scale-large" id="loan-total-payment">₹0</div>
                    </div>
                </div>
            </div>

            <div class="result-card text-start shadow-sm">
                <div class="text-secondary small mb-2">Payment Breakdown</div>
                <div class="progress-bar-custom">
                    <div id="bar-principal" class="bg-principal" style="width: 100%;"></div>
                    <div id="bar-interest" class="bg-interest" style="width: 0%;"></div>
                </div>
                <div class="d-flex justify-content-between small text-secondary mt-2 overflow-protect">
                    <div class="me-3"><i class="bi bi-circle-fill dot-principal me-1" style="font-size: 0.6rem;"></i> <span id="label-principal">Principal: ₹0</span></div>
                    <div><i class="bi bi-circle-fill dot-interest me-1" style="font-size: 0.6rem;"></i> <span id="label-interest">Interest: ₹0</span></div>
                </div>
            </div>
        </div>
    `;

    new LoanCalculator();

    const calculatorContainer = document.querySelector('.calculator-container');
    const keypadArea = document.getElementById('keypad-area');
    
    const observer = new MutationObserver(() => {
        if (loanContainer.classList.contains('active')) {
            calculatorContainer.classList.add('hide-display-area');
            keypadArea.classList.replace('flex-shrink-0', 'flex-grow-1'); 
        } else {
            if (document.getElementById('standard-mode').classList.contains('active') || 
                document.getElementById('scientific-mode').classList.contains('active')) {
                calculatorContainer.classList.remove('hide-display-area');
                keypadArea.classList.replace('flex-grow-1', 'flex-shrink-0');
            }
        }
    });
    observer.observe(loanContainer, { attributes: true, attributeFilter: ['class'] });
});