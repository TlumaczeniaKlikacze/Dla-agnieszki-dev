const fs = require('fs')
const os = require('os')
const ipc = require('electron').ipcRenderer;
const csv = require('csvtojson');
const converter = require('json-2-csv');
const homeDir = require('os').homedir()
const desktopDir = `${homeDir}/Desktop/`;

let folder = undefined;
const choose_folder = document.querySelector('#choose_folder');//przycisk do wyboru folderu

//wybieram folder
choose_folder.addEventListener('click',()=>{
    ipc.send('open-folder-dialog')
})
//zwraca mi folder
ipc.on('selected-file', function (event, path) {
    folder = path[0]
});
let array_of_buffers = []
let text_from_pdfs = []

//teraz przycisk start

ipc.on('pdf_file', async function (event, data) {
    if(typeof data === 'string' && data == 'error'){
        alert('Nie udało się przetworzyć jednego z plików. Jest on uszkodzony bądź niepoprawny. Program zakończył pracę!')
        ipc.send('close-me')
    }
    text_from_pdfs.push(data.text)
})

const clear_and_write = (d)=>{
    let data = d
    let tmp_keys
    for(let i=0;i<data.length;i++){
        tmp_keys = Object.keys(data[i])
        for(let j=0;j<tmp_keys.length;j++){
            if(data[i][tmp_keys[j]].includes('zł'))
            data[i][tmp_keys[j]] = data[i][tmp_keys[j]].replace('zł','')
            data[i][tmp_keys[j]] = data[i][tmp_keys[j]].trim()
        }
    }

    converter.json2csv(data, (err, csv) => {
        if (err) {
               alert("Błąd krytyczny programu, spróbuj ponownie.")
             ipc.send('close-me')
        }
        fs.writeFileSync(`${desktopDir}Pliczek_vat_ceny.csv`, csv);
        alert("Plik został zapisany na pulpicie pod nazwa Pliczek_vat_ceny.csv.")
        ipc.send('close-me')
    });
}


const conver = (el)=>{
    return new Promise((res,rej)=>{
        tmpe=[]
        csv({ignoreEmpty: false,delimiter:";",noheader:true})
        .fromString(el)
        .subscribe((jsonObj,index)=>{
            tmpe.push(jsonObj)
        })
        .on('done',async()=>{
            res(tmpe)
        })
    })
}

const conver_to_json = async()=>{
    let array_of_ready_csv = []
    let tmpa;

    for(let z =0;z<text_from_pdfs.length;z++){
        pdf_splitet = text_from_pdfs[z].split("Dokument wygenerowany przez IdoSell")
        for(let i =0;i<pdf_splitet.length;i++){
            tmpa = await conver(pdf_splitet[i])
            array_of_ready_csv = array_of_ready_csv.concat(tmpa)
        }
        if(z+1 == text_from_pdfs.length)
        clear_and_write(array_of_ready_csv)
    }


}



const interval_check = (length)=>{
    const x = setInterval(() => {
        if(length == text_from_pdfs.length){
            clearInterval(x)
            conver_to_json()
        }
    }, 3000);
}
const read_files = ()=>{
    interval_check(array_of_buffers.length)
    array_of_buffers.forEach(e=>{
        ipc.send('read_pdf_file',e)
     
    })
}
const start_button = document.querySelector("#start_button")
start_button.addEventListener('click',()=>{
    if(folder != undefined){
        choose_folder.disabled= true
        start_button.disabled = true
        fs.readdir(`${folder}`,(err,files)=>{
            alert(`Program wykrył ${files.length}szt. plików, sprawdź czy ilość jest poprawna.`)
            files.forEach(file => {
                array_of_buffers.push(fs.readFileSync(`${folder}\\${file}`))
              });
              read_files()
        })
    }else{
        alert('Wybierz folder')
    }
})
