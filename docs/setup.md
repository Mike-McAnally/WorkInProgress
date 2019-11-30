# Setting up your own instance

Requirements:
- OS: Ubuntu 16.04 or above
- Git
- Node (and NPM)
- Ghostscript & Graphicsmagick (necessary for PDF conversion functionality)

## Setup steps:
1. Install main requirements
  - Node:
  ```
    $ sudo apt-get install curl
    $ curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -
    $ sudo apt-get install nodejs
  ```
  - Git
  ```
    $ sudo apt-get update
    $ sudo apt-get install git
  ```
  - Ghostscript  
  ```
    $ sudo apt-get install ghostscript
  ```
  - Graphicsmagick  
  ```  
    $ sudo apt-get install build-essential software-properties-common libjpeg-dev libtiff5-dev libpng16-dev --fix-missing
    $ wget --no-cookies --timestamping https://downloads.sourceforge.net/project/graphicsmagick/graphicsmagick/1.3.33/GraphicsMagick-1.3.33.tar.gz
    $ tar -xvf GraphicsMagick-1.3.33.tar.gz
    $ cd /opt/graphicsmagick/src/GraphicsMagick-1.3.26
    $ ./configure --prefix=/opt/graphicsmagick/GraphicsMagick-1.3.26
    $ make
    $ make install

    # test if it was successfully installed with command below
    $ gm version
  ```

2. Clone repository
```
  $ git clone https://github.com/Mike-McAnally/WorkInProgress
  $ cd WorkInProgress
```

3. Install node dependencies
```
  $ npm install
```

4. Install forever.js and Run application
```
  $ npm install forever -g
  $ forever start index.js
```