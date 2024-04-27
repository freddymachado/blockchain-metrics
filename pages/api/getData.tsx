import {JSDOM} from '../../node_modules/jsdom'
import { NextApiRequest, NextApiResponse } from '../../node_modules/next/dist/shared/lib/utils'
import {google} from '../../node_modules/googleapis'

const getData = async (req: NextApiRequest, res: NextApiResponse) =>{
    const response = await fetch('https://farside.co.uk/?p=997')
    const html = await response.text()

    const dom = new JSDOM(html)
    const document = dom.window.document
    const rows = document.getElementsByTagName("td");
    console.log('rows', rows.textContent);
    console.log('rowslength', rows.length);

    try {
        //prepare auth
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g,'\n')
            },
            scopes:[
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/spreadsheets'
            ]
        });

        const sheets = google.sheets({
            auth,
            version: 'v4'
        });

        //obtain previously added data
        let lastData = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'A2:A'
        })
        console.log('lastData', lastData.data.values); 

        var arr = Array.from(rows);

        checkData(arr,lastData.data.values,sheets)

        //return res.status(200).json({data:gresponse.data})
    } catch (error) {
        return res.status(500).send({message:error.message ?? 'Something went wrong'})
    }  

    //Send table back to client
    res.status(200).json({rows});
}

const checkData = async (rows, lastData, sheets) =>{
    lastData.forEach(element => {
        if(element.includes(rows[0].textContent)){
            console.log('row already wrote', rows.splice(0,13).value);  
        }
    });


    if(rows[0].textContent in lastData){
        console.log('rows already wrote', rows.splice(0,13));  
    }else{
        if(rows.length > 11){
            const gresponse = await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'A1:L1',
                valueInputOption: 'USER_ENTERED',
                requestBody:{
                    values:[
                        [rows[0].textContent.replace(".", ","),rows[1].textContent.replace(".", ","),rows[2].textContent.replace(".", ",")
                        ,rows[3].textContent.replace(".", ","),rows[4].textContent.replace(".", ","),rows[5].textContent.replace(".", ",")
                        ,rows[6].textContent.replace(".", ","),rows[7].textContent.replace(".", ","),rows[8].textContent.replace(".", ",")
                        ,rows[9].textContent.replace(".", ","),rows[10].textContent.replace(".", ","),rows[11].textContent.replace(".", ",")
                        ,rows[12].textContent.replace(".", ",")]
                    ]
                }
            });
            console.log('row wrote', rows.splice(0,13).value);
        }else{
            console.log('No new data')
        }
    }
}
export default getData