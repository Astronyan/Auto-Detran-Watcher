const { chromium, devices } = require('playwright');
require('./createFileServer')
require('dotenv').config();

(async () => {
    // Setup
    const browser = await chromium.launch({
        headless: false, args: [
            '--use-fake-ui-for-media-stream',
            '--autoplay-policy=no-user-gesture-required'
        ]
    });
    const context = await browser.newContext(devices['Desktop Chrome']);
    const page = await context.newPage();
    page.on('load', emulateWebCam)

    //init
    const detranWebsite = 'https://cnh.movscool.com.br/'
    const classLink = process.argv[2] || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    const login = process.env.DETRAN_LOGIN
    const password = process.env.DETRAN_PASSWORD
    const loopTime = 2 * 60 * 1000 // 2 minutes

    //login
    await page.goto(detranWebsite);
    const userLogin = await page.waitForSelector('#email')
    const userPassword = await page.waitForSelector('#password')
    await userLogin.click()
    await userLogin.fill(login)
    await userPassword.click()
    await userPassword.fill(password)
    await userPassword.press('Enter')
    await page.waitForTimeout(2000)

    await page.waitForTimeout(3000) 
    await page.evaluate(() => {
        const buttons = document.querySelectorAll('.mat-mdc-button-persistent-ripple.mdc-button__ripple')
        const clickableButton = buttons[1]
        clickableButton.click()
    })

    //enable cam

    async function emulateWebCam() {
        await page.evaluate(() => {
            const videoSrc = `http://localhost:8000`;
            const videoElement = document.createElement('video');

            //fetching the video
            fetch(videoSrc)
                .then(response => response.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    videoElement.src = url;
                    videoElement.loop = true
                }).catch(err => console.log('erro ao buscar o video: ', err))

            // Substituir getUserMedia para usar este vídeo como source
            navigator.mediaDevices.getUserMedia = async (constraints) => {

                if (constraints.video) {
                    const stream = await new Promise((resolve, reject) => {
                        videoElement.muted = true
                        videoElement.play().then(() => console.log('video been played')).catch(err => console.log('houve um erro ao reproduzir o vídeo: ', err))
                        resolve(videoElement.captureStream())
                    })

                    return stream
                }
            }
        });
    }
    emulateWebCam()

    async function photoClicker() {
        console.log('searching photo button')

        try {
            await page.waitForSelector('[aria-label="capture-button"]')
                .then(async photoButton => {
                    if (photoButton.isVisible()) {
                        await photoButton.click();
                        console.log('foto tirada com sucesso');
                    }
                })
        }
        catch (err) {

            try {
                const button = await page.evaluateHandle(() => document.querySelectorAll('.mat-mdc-button-touch-target')[0].parentElement)
                if (!(await okButton.isVisible())) return
                button.click()
                console.log('foto final tirada com sucesso')

            }

            catch (err) {
                console.log('botão de foto não encontrado')
            }
        }
        finally {

            try {
                const okButton = await page.evaluateHandle(() => document.querySelectorAll('.mdc-button__ripple')[0].parentElement)
                if (!(await okButton.isVisible())) return
                okButton.click()
                console.log('botão "ok" clicado com sucesso')
            }
            catch (err) {
                console.log('botão "ok" não encontrado')
            }
        }

        setTimeout(photoClicker, loopTime); // Utilizar setTimeout recursivo
    }
    setTimeout(photoClicker, loopTime); // start first looop
})();
