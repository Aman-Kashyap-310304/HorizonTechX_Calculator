class ScientificCalculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();
    }

    clear() {
        this.expression = '0';
        this.previousExpression = '';
        this.isComputed = false;
    }

    delete() {
        if (this.isComputed) return;
        if (this.expression === '0') return;
        
        // Remove trailing functions cleanly in one backspace (e.g., "sin(" or "log(")
        if (/(sin\(|cos\(|tan\(|asin\(|acos\(|atan\(|log\(|ln\(|√\()$/.test(this.expression)) {
            this.expression = this.expression.replace(/(sin\(|cos\(|tan\(|asin\(|acos\(|atan\(|log\(|ln\(|√\()$/, '');
        } else {
            this.expression = this.expression.toString().slice(0, -1);
        }
        
        if (this.expression === '') this.expression = '0';
    }

    append(val) {
        if (this.isComputed) {
            this.expression = '0';
            this.isComputed = false;
        }
        
        // Prevent multiple consecutive decimals
        if (val === '.' && this.expression.match(/[\d]+\.[\d]*$/)) return;
        
        if (this.expression === '0' && val !== '.') {
            this.expression = val.toString();
        } else {
            this.expression += val.toString();
        }

        // Run the Smart Typing Detection
        this.autoDetectFunction();
    }

    autoDetectFunction() {
        // Automatically convert typed letters into formatted calculator functions
        const funcs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln'];
        for (let fn of funcs) {
            if (this.expression.endsWith(fn)) {
                this.expression += '('; // Auto-add the parenthesis
                break;
            }
        }
        
        // Auto-convert specific text shortcuts
        if (this.expression.endsWith('sqrt')) {
            this.expression = this.expression.slice(0, -4) + '√(';
        }
        if (this.expression.endsWith('pi')) {
            this.expression = this.expression.slice(0, -2) + 'π';
        }
    }

    compute() {
        if (this.expression === '0' || this.expression === '') return;

        try {
            let evalString = this.expression;

            // 1. Format visual operators to JS Math operators
            evalString = evalString.replace(/×/g, '*').replace(/÷/g, '/');

            // 2. Implicit Multiplication (e.g., "2π" -> "2*π", "5sin(" -> "5*sin(")
            evalString = evalString.replace(/(\d)(π|e|sin|cos|tan|asin|acos|atan|log|ln|√|\()/g, '$1*$2');
            evalString = evalString.replace(/(\))(π|e|sin|cos|tan|asin|acos|atan|log|ln|√|\(|\d)/g, '$1*$2');

            // 3. Map constants, square roots, and exponents
            evalString = evalString.replace(/π/g, 'Math.PI')
                                   .replace(/e/g, 'Math.E')
                                   .replace(/√\(/g, 'sqrt(')
                                   .replace(/\^2/g, '**2')
                                   .replace(/\^/g, '**');

            // 4. Resolve Factorials (e.g., "5!" -> "factorial(5)")
            evalString = evalString.replace(/(\d+)!/g, 'factorial($1)');

            // 5. Auto-close missing parentheses
            let openParens = (evalString.match(/\(/g) || []).length;
            let closeParens = (evalString.match(/\)/g) || []).length;
            while (openParens > closeParens) {
                evalString += ')';
                closeParens++;
            }

            // 6. Advanced Math Engine (Converts standard Radians to correct Degrees)
            const mathScope = `
                const sin = (d) => Math.sin(d * Math.PI / 180);
                const cos = (d) => Math.cos(d * Math.PI / 180);
                const tan = (d) => Math.tan(d * Math.PI / 180);
                const asin = (v) => Math.asin(v) * 180 / Math.PI;
                const acos = (v) => Math.acos(v) * 180 / Math.PI;
                const atan = (v) => Math.atan(v) * 180 / Math.PI;
                const log = Math.log10;
                const ln = Math.log;
                const sqrt = Math.sqrt;
                const factorial = (n) => { 
                    if(n < 0) return NaN;
                    let r = 1; 
                    for(let i = 2; i <= n; i++) r *= i; 
                    return r; 
                };
                return (${evalString});
            `;

            // Evaluate the injected math environment safely
            let result = new Function(mathScope)();

            // Clean up extreme floating point precision errors (e.g., 0.1 + 0.2)
            result = Math.round(result * 10000000000) / 10000000000;

            if (isNaN(result) || !isFinite(result)) throw new Error("Math Error");

            this.previousExpression = this.expression + ' =';
            this.expression = result.toString();
            this.isComputed = true;

        } catch (error) {
            this.previousExpression = this.expression + ' =';
            this.expression = 'Error';
            this.isComputed = true;
        }
    }

    updateDisplay() {
        this.currentOperandElement.innerText = this.expression;
        this.previousOperandElement.innerText = this.previousExpression;
    }
}

// Inject HTML and Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const sciContainer = document.getElementById('scientific-mode');
    if (!sciContainer) return;

    // Injecting the exact 5x7 UI grid into the placeholder
    sciContainer.innerHTML = `
        <div class="row g-2 mb-2">
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="sin(">sin</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="cos(">cos</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="tan(">tan</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-operator sci-btn" data-val="(">(</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-operator sci-btn" data-val=")">)</button></div>
        </div>
        <div class="row g-2 mb-2">
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="asin(">asin</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="acos(">acos</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="atan(">atan</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="^2">x²</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-operator sci-btn" data-val="^">xʸ</button></div>
        </div>
        <div class="row g-2 mb-2">
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="log(">log</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="ln(">ln</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="√(">√</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="π">π</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="e">e</button></div>
        </div>
        <div class="row g-2 mb-2">
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" data-val="7">7</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" data-val="8">8</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" data-val="9">9</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-6 custom-number sci-btn" data-val="!">!</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-operator sci-btn" data-val="÷">÷</button></div>
        </div>
        <div class="row g-2 mb-2">
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" data-val="4">4</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" data-val="5">5</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" data-val="6">6</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" id="sci-clear">C</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-operator sci-btn" data-val="×">×</button></div>
        </div>
        <div class="row g-2 mb-2">
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" data-val="1">1</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" data-val="2">2</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" data-val="3">3</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-number sci-btn" data-val=".">.</button></div>
            <div class="col"><button class="btn w-100 rounded-pill fs-5 custom-operator sci-btn" data-val="-">-</button></div>
        </div>
        <div class="row g-2">
            <div class="col-5"><button class="btn w-100 rounded-pill fs-5 custom-number text-start ps-4 sci-btn" data-val="0">0</button></div>
            <div class="col-5"><button class="btn w-100 rounded-pill fs-5 custom-operator sci-btn" id="sci-equals">=</button></div>
            <div class="col-2"><button class="btn w-100 rounded-pill fs-5 custom-operator sci-btn" data-val="+">+</button></div>
        </div>
    `;

    // Ensure buttons scale slightly smaller to fit 7 rows on a laptop screen
    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `.sci-btn { height: min(55px, 6.5vh) !important; padding: 0; }`;
    document.head.appendChild(styleBlock);

    const previousOperandElement = document.getElementById('previous-operand');
    const currentOperandElement = document.getElementById('current-operand');
    const calculator = new ScientificCalculator(previousOperandElement, currentOperandElement);

    // --- Mouse Click Listeners ---
    const sciButtons = sciContainer.querySelectorAll('.sci-btn[data-val]');
    const equalsButton = document.getElementById('sci-equals');
    const clearButton = document.getElementById('sci-clear');

    sciButtons.forEach(button => {
        button.addEventListener('click', () => {
            if(!sciContainer.classList.contains('active')) return;
            calculator.append(button.getAttribute('data-val'));
            calculator.updateDisplay();
        });
    });

    equalsButton.addEventListener('click', () => {
        if(!sciContainer.classList.contains('active')) return;
        calculator.compute();
        calculator.updateDisplay();
    });

    clearButton.addEventListener('click', () => {
        if(!sciContainer.classList.contains('active')) return;
        calculator.clear();
        calculator.updateDisplay();
    });

    // --- Advanced Full Keyboard Listeners ---
    document.addEventListener('keydown', (event) => {
        if(!sciContainer.classList.contains('active')) return;

        const key = event.key;
        const code = event.code;

        // Catch numbers (Standard Row & Numpad)
        const isNumber = /^[0-9]$/.test(key) || (code.startsWith('Numpad') && code.length === 7);
        if (isNumber) {
            const num = code.startsWith('Numpad') ? code.slice(-1) : key;
            calculator.append(num);
            calculator.updateDisplay();
            return;
        }

        // Catch standard math operators and decimals
        const validSymbols = /^[.+\-*\/()^!e]$/;
        if (validSymbols.test(key) || code === 'NumpadDecimal' || code === 'NumpadAdd' || code === 'NumpadSubtract' || code === 'NumpadMultiply' || code === 'NumpadDivide') {
            
            if (key === '/' || code === 'NumpadDivide') event.preventDefault(); // Stop quick-find
            
            let val = key;
            if (key === '*' || code === 'NumpadMultiply') val = '×';
            if (key === '/' || code === 'NumpadDivide') val = '÷';
            if (code === 'NumpadAdd') val = '+';
            if (code === 'NumpadSubtract') val = '-';
            if (code === 'NumpadDecimal') val = '.';

            calculator.append(val);
            calculator.updateDisplay();
            return;
        }

        // Catch Alphabet typing for Smart Auto-Detect functions (s, i, n, etc.)
        if (/^[a-z]$/i.test(key)) {
            // Map p to π directly as a shorthand
            if (key.toLowerCase() === 'p') {
                calculator.append('π');
            } else {
                calculator.append(key.toLowerCase());
            }
            calculator.updateDisplay();
            return;
        }

        // Execution Actions
        if (key === 'Enter' || key === '=' || code === 'NumpadEnter') {
            event.preventDefault();
            calculator.compute();
            calculator.updateDisplay();
        }
        if (key === 'Backspace') {
            calculator.delete();
            calculator.updateDisplay();
        }
        if (key === 'Escape' || key === 'Delete') {
            calculator.clear();
            calculator.updateDisplay();
        }
    });
});