class ShareButton extends HTMLElement {
    static get observedAttributes() {
        return ['note-text', 'label', 'aria-label'];
    }

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });

        // Create the main button element
        const button = document.createElement("button");
        button.innerHTML = `<slot>Share</slot>`;
        const initialLabel = this.getAttribute('aria-label') || this.getAttribute('label') || 'Share Note';
        button.setAttribute('aria-label', initialLabel);

        // Create a status element for screen readers
        const status = document.createElement('div');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.className = 'sr-only';

        // Add some basic styling
        const style = document.createElement("style");
        style.textContent = `
            :host { display: inline-block; }
            button {
                background: var(--primary-color, #5f0f40);
                color: white;
                border: none;
                padding: 10px 14px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1rem;
            }
            button:hover {
                background: var(--primary-color-dark, #9a031e);
            }
            button:focus { outline: none; }
            button:focus-visible {
                outline: 3px solid color-mix(in srgb, var(--primary-color, #5f0f40) 60%, white);
                box-shadow: 0 0 0 3px rgba(0,0,0,0.08);
            }
            .sr-only {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0 0 0 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            }
        `;

        shadow.appendChild(style);
        shadow.appendChild(button);
        shadow.appendChild(status);

        // Handle click events with proper error handling
        button.addEventListener("click", async () => {
            const noteText = this.getAttribute("note-text") || "";
            await this.handleShare(noteText, status);
        });

        // Store references for later use
        this._button = button;
        this._status = status;
    }

    /**
     * Handle the actual sharing logic with multiple fallbacks
     * Tries Web Share API first, then Clipboard API, then manual copy
     */
    async handleShare(noteText, status) {
        if (!noteText.trim()) {
            this.showStatus(status, 'Nothing to share');
            return;
        }

        // First try the modern Web Share API
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Duly Noted",
                    text: noteText,
                });
                this.showStatus(status, 'Shared successfully');
            } catch (err) {
                console.error("Web Share API failed:", err);
                this.showStatus(status, 'Sharing not supported');
            }
        } 
        // Fallback to clipboard API
        else if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(noteText);
                this.showStatus(status, 'Copied to clipboard');
            } catch (err) {
                console.error('Clipboard API failed:', err);
                await this.fallbackCopy(noteText, status);
            }
        } 
        // Last resort: manual copy via prompt
        else {
            this.manualCopy(noteText, status);
        }
    }

    /**
     * Fallback copy method using textarea and execCommand
     * This is for older browsers that don't support Clipboard API
     */
    async fallbackCopy(noteText, status) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = noteText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showStatus(status, 'Copied to clipboard');
        } catch (e) {
            console.error('Fallback copy method failed:', e);
            this.showStatus(status, 'Copy failed');
        }
    }

    /**
     * Manual copy method using window.prompt
     * Shows the text in a prompt so user can manually copy it
     */
    manualCopy(noteText, status) {
        try {
            window.prompt('Copy this note text:', noteText);
            this.showStatus(status, 'Manual copy shown');
        } catch (e) {
            console.error('Manual copy failed:', e);
            this.showStatus(status, 'Copy unavailable');
        }
    }

    /**
     * Show a status message and hide it after a delay
     */
    showStatus(statusElement, message) {
        statusElement.textContent = message;
        setTimeout(() => { 
            statusElement.textContent = ''; 
        }, 2000);
    }

    /**
     * Handle attribute changes (like aria-label updates)
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'label' || name === 'aria-label') {
            const label = this.getAttribute('aria-label') || this.getAttribute('label') || 'Share Note';
            if (this._button) this._button.setAttribute('aria-label', label);
        }
        // note-text changes don't require DOM updates here
    }
}

// Register the custom element once so hot reload and Storybook don't throw.
if (!customElements.get("share-button")) {
    customElements.define("share-button", ShareButton);
}

// TODO: Add support for sharing URLs when we have note links
// TODO: Maybe add a tooltip showing what sharing method is being used
