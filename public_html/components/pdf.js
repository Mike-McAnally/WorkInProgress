if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('pdf-reader', {
    schema: {
        fileName: {default: ''},
        clickableClass: {default: 'clickable'},
        flipIconSrc: {default: ''},
        settingsIconSrc: {default: ''}
    },
  
    init: function() {
        // create "Loading File" plane
        const pdfEl = document.createElement('a-entity');
        pdfEl.id = `${this.data.fileName}_PDF`;
        pdfEl.setAttribute('geometry', 'primitive: plane; width: 0.42; height: 0.594')
        pdfEl.setAttribute('material', 'color: #fff; side: double;')

        const text = document.createElement('a-text');
        text.setAttribute('value', 'Loading File');
        text.setAttribute('rotation', '0 0 45');
        text.setAttribute('position', '-0.14 -0.1 0.001');
        text.setAttribute('color', '#000');
        text.setAttribute('width', '1.5');
        text.setAttribute('height', '2');

        pdfEl.appendChild(text);
        this.el.appendChild(pdfEl);

        // create prev button
        const prevBtnEl = document.createElement('a-circle');
        prevBtnEl.id = `${this.data.fileName}-prev-page`;
        prevBtnEl.className = this.data.clickableClass;
        prevBtnEl.setAttribute('radius', '0.05');
        prevBtnEl.setAttribute('src', this.data.flipIconSrc);
        prevBtnEl.setAttribute('position', '-0.3 0 0.01')
        prevBtnEl.setAttribute('rotation', '0 0 180')
        this.el.appendChild(prevBtnEl);

        // create next button
        const nextBtnEl = document.createElement('a-circle');
        nextBtnEl.id = `${this.data.fileName}-next-page`;
        nextBtnEl.className = this.data.clickableClass;
        nextBtnEl.setAttribute('radius', '0.05');
        nextBtnEl.setAttribute('src', this.data.flipIconSrc);
        nextBtnEl.setAttribute('position', '0.3 0 0.01')
        this.el.appendChild(nextBtnEl);

        // create settings button
        const settingsBtnEl = document.createElement('a-circle');
        settingsBtnEl.id = `${this.data.fileName}-open-settings`;
        settingsBtnEl.className = this.data.clickableClass;
        settingsBtnEl.setAttribute('radius', '0.05');
        settingsBtnEl.setAttribute('src', this.data.settingsIconSrc);
        settingsBtnEl.setAttribute('position', '0.3 0.23 0.01')
        this.el.appendChild(settingsBtnEl);
        
        this.attachEventListeners();
        this.fetchFile()
    },

    attachEventListeners: function() {
        const self = this;
        // Add event listeners for buttons
        document.querySelector(`#${this.data.fileName}-prev-page`).addEventListener('click', function() {
            self.getPrevPage(self)
        });

        document.querySelector(`#${this.data.fileName}-next-page`).addEventListener('click', function() {
            self.getNextPage(self)
        });

        // TODO: add listener to animate settings button
            // Should generate option to resize pdf file
                // small: scale="1 1 1"
                // medium: scale="3 3 3"
                // large: scale="5 5 5"
    },

    fetchFile: async function() {
        try {
            let page = parseInt(window.localStorage.getItem(`${this.data.fileName}_currentPage`));
            if (isNaN(page)) {
                window.localStorage.setItem(`${this.data.fileName}_currentPage`, 1);
                page = 1;
            }
            const response = await fetch(`/${this.data.fileName}.pdf/${page}`);
            const data = await response.json();
            
            if (data && data.pages) {
                window.localStorage.setItem(`${this.data.fileName}_totalPages`, data.files.length)
                window.localStorage.setItem(`${this.data.fileName}_PdfBasePath`, `/assets/tmp/${this.data.fileName}/`)
                this.renderPage(parseInt(window.localStorage.getItem(`${this.data.fileName}_currentPage`)), this)
            }
        } catch (e) {
            //TODO: Attach ERROR plane to viewer instead
            console.log(e)
        }
    },

    renderPage: function(page, self) {
        const prevPdf = document.querySelector(`#${self.data.fileName}_PDF`);
        if (prevPdf) {
            prevPdf.parentNode.removeChild(prevPdf);
        }
        const pdfEl = document.createElement('a-entity');
        const basePath = window.localStorage.getItem(`${self.data.fileName}_PdfBasePath`);
        pdfEl.id = `${self.data.fileName}_PDF`;
        pdfEl.setAttribute('geometry', 'primitive: plane; width: 0.42; height: 0.594')
        pdfEl.setAttribute('material', `color: #fff; side: double; src: ${basePath}/${self.data.fileName}_${page}.png`)
        self.el.appendChild(pdfEl);

        window.localStorage.setItem(`${self.data.fileName}_currentPage`, page);
    },

    getPrevPage: function(self) {
        const page = parseInt(window.localStorage.getItem(`${self.data.fileName}_currentPage`));
        if (page > 1) {
            const newPage = page - 1;
            self.renderPage(newPage, self)
        }
    },

    getNextPage: function(self) {
        const page = parseInt(window.localStorage.getItem(`${self.data.fileName}_currentPage`));
        const totalPages = parseInt(window.localStorage.getItem(`${self.data.fileName}_totalPages`));
        if (page < totalPages) {
            const newPage = page + 1;
            self.renderPage(newPage, self)
        }
    },
  
    removeEventListeners: function() {
        
    },

    remove: function() {
      this.removeEventListeners();
    },
});