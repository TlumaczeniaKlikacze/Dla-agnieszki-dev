const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs')
const os = require('os');
const pdf = require('pdf-parse');
const ipc = require('electron').ipcMain;


const {app, BrowserWindow,Menu, dialog, session,remote} = electron;
let mainWindow;
app.on('ready', ()=>{
    //create new window
    mainWindow = new BrowserWindow({ 
        show: true,
        width:250,
        maxWidth:250,
        maxHeight:250,
        height:250,
        minWidth:250,
        minHeight:250,
        webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
    }});

    //Load html into window
    mainWindow.loadURL(url.format({
        pathname:path.join(__dirname, "view/mainWindow.html"),
        protocol:'file:',
        slashes:true,
       
    }))
    
    //Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    //insert menu
    Menu.setApplicationMenu(mainMenu)
    
})

const mainMenuTemplate = [
    {
        label:'File',
        submenu:[
            {
                label:'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q':
                'Ctrl+Q',
                click(){
                    app.quit()
                }

        }
        ]
    }
];
mainMenuTemplate.push({label:"Developer Tools",
    submenu:[
        {
            label:'Toogle DevTools',
            accelerator: process.platform == 'darwin' ? 'Command+I' :
            'Ctrl+I',
            click(item,focusedWindow){
                focusedWindow.toggleDevTools()
            }
        },
        {
            role:"reload"
        }
    ]


})
ipc.on('close-me', (evt, arg) => {
    app.quit()
  })

ipc.on('open-folder-dialog', function (event) {
    console.log('xd')
    if(os.platform() === 'linux' || os.platform() === 'win32'){
        dialog.showOpenDialog({
            properties: ['openDirectory']
         }).then((e)=>{
            event.sender.send('selected-file', e.filePaths)

         })
   } else {
     dialog.showOpenDialog({
    properties: ['openDirectory']
     }).then((e)=>{
        event.sender.send('selected-file', e.filePaths)

     })
  
   }});

   ipc.on('read_pdf_file',(event,dataBuffer)=>{
    pdf(dataBuffer).then(function(data) {
        event.sender.send('pdf_file',data)
    })
    .catch(function(error){
        // handle exceptions
        event.sender.send('pdf_file','error')
    })
})