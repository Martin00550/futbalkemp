const config = {
    MOCK_MODE: true, // Set to true to test without real Web3Forms keys
    keys: {
        SK: "YOUR_WEB3FORMS_SK_ACCESS_KEY", 
        CZ: "YOUR_WEB3FORMS_CZ_ACCESS_KEY"  
    },
    payment: {
        SK: {
            amount: "€250",
            iban: "SK00 0000 0000 0000 0000 0000",
            swift: "XXXXSKBX"
        },
        CZ: {
            amount: "6500 Kč",
            iban: "CZ00 0000 0000 0000 0000 0000",
            swift: "XXXXCZBX"
        }
    }
};

let currentCountry = 'SK';
let currentVS = '';

// Expose functions to window for onclick handlers
window.goToStep = function(step) {
    const steps = document.querySelectorAll('.step');
    steps.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const target = document.getElementById(`step-${step}`);
    target.style.display = 'block';
    setTimeout(() => target.classList.add('active'), 10);

    // Update Progress Indicator
    updateProgress(step);
};

function updateProgress(step) {
    const progressSteps = document.querySelectorAll('.progress-step');
    const lines = document.querySelectorAll('.progress-line');
    
    progressSteps.forEach((ps, idx) => {
        if (idx + 1 <= step) {
            ps.classList.add('active');
        } else {
            ps.classList.remove('active');
        }
    });

    lines.forEach((line, idx) => {
        if (idx + 1 < step) {
            line.style.setProperty('--progress-width', '100%');
            // Add a class for CSS transition handle
            line.classList.add('filled');
        } else {
            line.classList.remove('filled');
        }
    });
}

window.selectCountry = function(country) {
    currentCountry = country;
    const accessKey = config.keys[country];
    
    const setSafeText = (selector, text) => {
        const el = document.querySelector(selector);
        if (el) el.innerText = text;
    };

    const setSafeAttr = (selector, attr, value) => {
        const el = document.querySelector(selector);
        if (el) el[attr] = value;
    };

    setSafeAttr('#access_key', 'value', accessKey);
    setSafeAttr('#form-country', 'value', country);
    setSafeText('#form-title', country === 'CZ' ? 'VYPLŇTE OSOBNÍ ÚDAJE' : 'VYPLŇ OSOBNÉ ÚDAJE');
    
    if (country === 'CZ') {
        setSafeText('label[for="name"]', 'CELÉ JMÉNO HRÁČE');
        setSafeAttr('input[id="name"]', 'placeholder', 'např. Jan Novák');
        setSafeText('label[for="name"] + input + .helper-text', 'Jméno a příjmení účastníka');
        
        setSafeText('label[for="email"]', 'E-MAILOVÁ ADRESA');
        setSafeAttr('input[id="email"]', 'placeholder', 'jan.novak@email.cz');
        setSafeText('label[for="email"] + input + .helper-text', 'Sem vám pošleme potvrzení');
        
        setSafeText('label[for="phone"]', 'TELEFONNÍ ČÍSLO');
        setSafeAttr('input[id="phone"]', 'placeholder', '+420 000 000 000');
        setSafeText('label[for="phone"] + input + .helper-text', 'Pro důležité SMS informace');

        setSafeText('.reset-btn-premium', 'NOVÁ REGISTRACE');
    } else {
        setSafeText('label[for="name"]', 'CELÉ MENO HRÁČA');
        setSafeAttr('input[id="name"]', 'placeholder', 'napr. Ján Kováč');
        setSafeText('label[for="name"] + input + .helper-text', 'Meno a priezvisko účastníka');
        
        setSafeText('label[for="email"]', 'E-MAILOVÁ ADRESA');
        setSafeAttr('input[id="email"]', 'placeholder', 'jan.kovac@email.sk');
        setSafeText('label[for="email"] + input + .helper-text', 'Sem ti pošleme potvrdenie');
        
        setSafeText('label[for="phone"]', 'TELEFÓNNE ČÍSLO');
        setSafeAttr('input[id="phone"]', 'placeholder', '+421 900 000 000');
        setSafeText('label[for="phone"] + input + .helper-text', 'Pre dôležité SMS informácie');

        setSafeText('.reset-btn-premium', 'NOVÁ REGISTRÁCIA');
    }

    goToStep(2);
};

window.handleFormSubmit = async function(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const status = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');
    const loader = document.getElementById('loader');

    // Add timestamp
    const timestamp = new Date().toLocaleString();
    document.getElementById('form-timestamp').value = timestamp;
    formData.set('timestamp', timestamp);

    // Generate random 6-digit Variable Symbol
    currentVS = Math.floor(100000 + Math.random() * 900000).toString();
    formData.set('Variabilny_Symbol', currentVS);

    // UX: Disable button and show loader
    submitBtn.disabled = true;
    loader.style.display = 'block';
    status.innerText = 'ODOSIELAM PRIHLÁŠKU...';
    status.style.color = 'var(--primary)';

    try {
        let result;
        if (config.MOCK_MODE) {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            result = { success: true };
            console.log("Mock submission successful", Object.fromEntries(formData));
        } else {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });
            result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Submission failed');
        }

        if (result.success || result.status === 200) {
            setupSuccessPage();
            goToStep(3);
        } else {
            throw new Error(result.message || 'Chyba pri spracovaní.');
        }
    } catch (error) {
        status.innerText = `CHYBA: ${error.message}`;
        status.style.color = 'var(--error)';
    } finally {
        submitBtn.disabled = false;
        loader.style.display = 'none';
    }
};

function setupSuccessPage() {
    const pay = config.payment[currentCountry];
    document.getElementById('pay-amount').innerText = pay.amount;
    document.getElementById('pay-iban').innerText = pay.iban;
    document.getElementById('pay-vs').innerText = currentVS;

    // Localize Payment Row Labels
    const labels = {
        SK: {
            header: 'REKAPITULÁCIA PLATBY',
            amount: 'SUMA K ÚHRADE:',
            ibanLabel: 'IBAN (Číslo účtu):',
            vs: 'VARIABILNÝ SYMBOL:'
        },
        CZ: {
            header: 'REKAPITULACE PLATBY',
            amount: 'ČÁSTKA K ÚHRADĚ:',
            ibanLabel: 'IBAN (Číslo účtu):',
            vs: 'VARIABILNÍ SYMBOL:'
        }
    };

    const currentLabels = labels[currentCountry];
    
    const header = document.querySelector('.payment-header-premium');
    if (header) header.innerText = currentLabels.header;

    const rows = document.querySelectorAll('.payment-row');
    if (rows.length >= 3) {
        rows[0].querySelector('span').innerText = currentLabels.amount;
        rows[1].querySelector('span').innerText = currentLabels.ibanLabel;
        rows[2].querySelector('span').innerText = currentLabels.vs;
    }
}

// Initial check for Dev Mode indicator
document.addEventListener('DOMContentLoaded', () => {
    const indicator = document.getElementById('mock-indicator');
    if (indicator) {
        indicator.style.display = config.MOCK_MODE ? 'block' : 'none';
    }
});

window.copyIban = function() {
    const iban = document.getElementById('pay-iban').innerText;
    navigator.clipboard.writeText(iban).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};
