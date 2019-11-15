if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('pdf-reader', {
    schema: {
        fileName: {default: ''},
        clickableClass: {default: 'clickable'},
        flipIconSrc: {default: ''},
        expandIconSrc: {default: ''},
        collapseIconSrc: {default: ''},
    },
  
    init: function() {
        this.data.isExpanded = false;
        // Attempt to load page from localStorage (if server already has converted file into images)
        this.renderPage(parseInt(window.localStorage.getItem(`${this.data.fileName}_currentPage`)), this)
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
        const expandBtnEl = document.createElement('a-circle');
        expandBtnEl.id = `${this.data.fileName}-expand-collapse`;
        expandBtnEl.className = this.data.clickableClass;
        expandBtnEl.setAttribute('radius', '0.05');
        expandBtnEl.setAttribute('src', this.data.expandIconSrc);
        expandBtnEl.setAttribute('position', '0.3 0.23 0.01')
        this.el.appendChild(expandBtnEl);
        
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

        document.querySelector(`#${this.data.fileName}-expand-collapse`).addEventListener('click', function() {
            if (!self.data.isExpanded) {
                self.el.setAttribute('scale', '4 4 4')
                document.querySelector(`#${self.data.fileName}-expand-collapse`).setAttribute('material', {
                    src: self.data.collapseIconSrc
                })
                self.data.isExpanded = true;
            } else {
                self.el.setAttribute('scale', '1 1 1')
                document.querySelector(`#${self.data.fileName}-expand-collapse`).setAttribute('material', {
                    src: self.data.expandIconSrc
                })
                self.data.isExpanded = false;
            }
        });
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