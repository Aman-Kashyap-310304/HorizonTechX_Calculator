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
        // Using en-IN to get the standard 1,00,000 comma formatting shown in your design
        return '₹' + Math.round(number).toLocaleString('en-IN');
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
                emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
            } else {
                emi = principal / months; // Zero interest scenario
            }
            totalPayment = emi * months;
            totalInterest = totalPayment - principal;
        }

        // Update DOM Text
        this.emiDisplay.innerText = this.formatCurrency(emi);
        this.totalInterestDisplay.innerText = this.formatCurrency(totalInterest);
        this.totalPaymentDisplay.innerText = this.formatCurrency(totalPayment);
        this.labelPrincipal.innerText = `Principal: ${this.formatCurrency(principal)}`;
        this.labelInterest.innerText = `Interest: ${this.formatCurrency(totalInterest)}`;

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

    // --- Injecting Custom CSS for Loan UI ---
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
        
        /* Result Cards */
        .result-card { background-color: var(--btn-num-bg); border-radius: 16px; padding: 20px; }
        .progress-bar-custom { height: 12px; border-radius: 10px; display: flex; overflow: hidden; margin-bottom: 12px; }
        .bg-principal { background-color: var(--btn-accent-bg); }
        .bg-interest { background-color: #ff6b6b; }
        .dot-principal { color: var(--btn-accent-bg); }
        .dot-interest { color: #ff6b6b; }
    `;
    document.head.appendChild(styleBlock);

    // --- Injecting the Loan HTML ---
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

            <div class="result-card text-start mb-3 shadow-sm">
                <div class="text-secondary small mb-1">Monthly EMI</div>
                <div class="fs-1 fw-bold lh-1 text-body" id="loan-emi">₹0</div>
            </div>

            <div class="row g-3 mb-3">
                <div class="col-6">
                    <div class="result-card text-start h-100 shadow-sm">
                        <div class="text-secondary small mb-1">Total Interest</div>
                        <div class="fs-4 fw-bold text-body" id="loan-total-interest">₹0</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="result-card text-start h-100 shadow-sm">
                        <div class="text-secondary small mb-1">Total Payment</div>
                        <div class="fs-4 fw-bold text-body" id="loan-total-payment">₹0</div>
                    </div>
                </div>
            </div>

            <div class="result-card text-start shadow-sm">
                <div class="text-secondary small mb-2">Payment Breakdown</div>
                <div class="progress-bar-custom">
                    <div id="bar-principal" class="bg-principal" style="width: 100%;"></div>
                    <div id="bar-interest" class="bg-interest" style="width: 0%;"></div>
                </div>
                <div class="d-flex justify-content-between small text-secondary mt-2">
                    <div><i class="bi bi-circle-fill dot-principal me-1" style="font-size: 0.6rem;"></i> <span id="label-principal">Principal: ₹0</span></div>
                    <div><i class="bi bi-circle-fill dot-interest me-1" style="font-size: 0.6rem;"></i> <span id="label-interest">Interest: ₹0</span></div>
                </div>
            </div>
        </div>
    `;

    // Initialize logic
    new LoanCalculator();

    // --- Dynamic Layout Manager ---
    // Automatically hides the giant top display area when Loan mode is opened
    const calculatorContainer = document.querySelector('.calculator-container');
    const keypadArea = document.getElementById('keypad-area');
    
    const observer = new MutationObserver(() => {
        if (loanContainer.classList.contains('active')) {
            calculatorContainer.classList.add('hide-display-area');
            keypadArea.classList.replace('flex-shrink-0', 'flex-grow-1'); // Let it take up the empty space
        } else {
            // Restore normal layout if we switch back to standard or scientific
            if (document.getElementById('standard-mode').classList.contains('active') || 
                document.getElementById('scientific-mode').classList.contains('active')) {
                calculatorContainer.classList.remove('hide-display-area');
                keypadArea.classList.replace('flex-grow-1', 'flex-shrink-0');
            }
        }
    });
    observer.observe(loanContainer, { attributes: true, attributeFilter: ['class'] });
});