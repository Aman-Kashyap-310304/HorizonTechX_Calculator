class ScientificCalculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();

        // Handle window resizing to keep fonts scaled perfectly
        window.addEventListener('resize', () => this.updateDisplay());
    }

    clear() {
        this.expression = '0';
        this.previousExpression = '';
        this.isComputed = false;
    }

    delete() {
        if (this.isComputed) return;
        if (this.expression === '0') return;
        
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
        
        if (val === '.' && this.expression.match(/[\d]+\.[\d]*$/)) return;
        
        // Prevent insane memory overflows while typing long expressions
        if (this.expression.length > 60) return;

        if (this.expression === '0' && val !== '.') {
            this.expression = val.toString();
        } else {
            this.expression += val.toString();
        }

        this.autoDetectFunction();
    }

    autoDetectFunction() {
        const funcs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln'];
        for (let fn of funcs) {
            if (this.expression.endsWith(fn)) {
                this.expression += '('; 
                break;
            }
        }
        
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

            evalString = evalString.replace(/×/g, '*').replace(/÷/g, '/');

            evalString = evalString.replace(/(\d)(π|e|sin|cos|tan|asin|acos|atan|log|ln|√|\()/g, '$1*$2');
            evalString = evalString.replace(/(\))(π|e|sin|cos|tan|asin|acos|atan|log|ln|√|\(|\d)/g, '$1*$2');

            evalString = evalString.replace(/π/g, 'Math.PI')
                                   .replace(/e/g, 'Math.E')
                                   .replace(/√\(/g, 'sqrt(')
                                   .replace(/\^2/g, '**2')
                                   .replace(/\^/g, '**');

            evalString = evalString.replace(/(\d+)!/g, 'factorial($1)');

            let openParens = (evalString.match(/\(/g) || []).length;
            let closeParens = (evalString.match(/\)/g) || []).length;
            while (openParens > closeParens) {
                evalString += ')';
                closeParens++;
            }

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

            let result = new Function(mathScope)();

            // Clean up float errors only on reasonable numbers to protect massive 'e' calculations
            if (Math.abs(result) < 1e12) {
                result = Math.round(result * 10000000000) / 10000000000;
            }

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

    // --- UX Preservation Method 1: Improved Formatting ---
    formatDisplayNumber(numStr) {
        if (numStr === 'NaN' || numStr === 'Infinity' || numStr === '-Infinity') return 'Error';
        
        let str = numStr.toString();
        let parsed = parseFloat(str);
        
        // Triggers 'e' notation at 15 digits (JS precision limit) for professional accuracy
        if (Math.abs(parsed) >= 1e15 || (Math.abs(parsed) < 1e-6 && Math.abs(parsed) > 0)) {
            return parsed.toExponential(6); 
        }
        
        return str;
    }

    // --- UX Preservation Method 2: Mathematical Auto-Scaling ---
    autoScaleFont(element) {
        element.style.transition = 'none';
        element.style.fontSize = '4.5rem'; // Base size
        
        const parentWidth = element.parentElement.clientWidth - 40; 
        const textWidth = element.scrollWidth;

        // Optimized check: If the formatted number is still too wide, scale it
        if (textWidth > parentWidth) {
            let newSize = 4.5 * (parentWidth / textWidth) * 0.95; 
            
            // Floor limit remains consistent
            if (newSize < 1.0) newSize = 1.0; 
            
            element.style.fontSize = `${newSize}rem`;
        }

        requestAnimationFrame(() => {
            element.style.transition = 'font-size 0.05s ease-out';
        });
    }

    updateDisplay() {
        const formattedExpression = this.formatDisplayNumber(this.expression);
        
        this.currentOperandElement.innerText = formattedExpression;
        this.previousOperandElement.innerText = this.previousExpression;

        this.autoScaleFont(this.currentOperandElement);
    }
}

// Inject HTML and Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const sciContainer = document.getElementById('scientific-mode');
    if (!sciContainer) return;

    // --- CSS Injection: The "Anti-Dancing" UI Lock ---
    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
        .sci-btn { height: min(55px, 6.5vh) !important; padding: 0; }
        
        #current-operand {
            height: 85px;          /* Locks container height permanently */
            line-height: 85px;     /* Anchors text vertically so shrinking font doesn't jump */
            text-align: right;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis; /* Graceful fallback if text hits minimum floor size */
            width: 100%;
        }
        #previous-operand {
            min-height: 35px;      /* Prevents top row from shifting */
            margin-bottom: 5px;
        }
        .display-area {
            justify-content: flex-end !important;
        }
    `;
    document.head.appendChild(styleBlock);

    // Strip old bootstrap font classes that interfere with mathematical scaling
    const currentOperandElement = document.getElementById('current-operand');
    const previousOperandElement = document.getElementById('previous-operand');
    currentOperandElement.classList.remove('display-1', 'display-2', 'display-3', 'display-4', 'display-5', 'display-6');

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

    const calculator = new ScientificCalculator(previousOperandElement, currentOperandElement);

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

    document.addEventListener('keydown', (event) => {
        if(!sciContainer.classList.contains('active')) return;

        const key = event.key;
        const code = event.code;

        const isNumber = /^[0-9]$/.test(key) || (code.startsWith('Numpad') && code.length === 7);
        if (isNumber) {
            const num = code.startsWith('Numpad') ? code.slice(-1) : key;
            calculator.append(num);
            calculator.updateDisplay();
            return;
        }

        const validSymbols = /^[.+\-*\/()^!e]$/;
        if (validSymbols.test(key) || code === 'NumpadDecimal' || code === 'NumpadAdd' || code === 'NumpadSubtract' || code === 'NumpadMultiply' || code === 'NumpadDivide') {
            
            if (key === '/' || code === 'NumpadDivide') event.preventDefault(); 
            
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

        if (/^[a-z]$/i.test(key)) {
            if (key.toLowerCase() === 'p') {
                calculator.append('π');
            } else {
                calculator.append(key.toLowerCase());
            }
            calculator.updateDisplay();
            return;
        }

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