let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

const src_web = "https://free.currencyconverterapi.com";
let from_currency = "USD";
let to_currency = "PHP";
let currencies = [];
let symbols = [];
let amt = 1;
let rating = 0;
let to_curr_index = 0;

// /api/v5/convert?q=USD_PHP,PHP_USD&compact=ultra&apiKey=[YOUR_API_KEY] 
//get rating "USD_PHP", "PHP_USD"

const main = document.querySelector('#main');

//function for onclick event of convert button
async function convertNow(){
	let curr_fr = document.getElementById('CURR_FR');
	let curr_to = document.getElementById('CURR_TO');
	let amnt_fr = document.getElementById('CURR_FR_VAL');
	let disp = await document.getElementById('displayResult');
	
	disp.innerHTML = `<input type="text" id="CURR_VAL" readonly placeholder="converting..." 
	style="background-color: #eee; font-weight: bold;" />`;

	from_currency = curr_fr.options[curr_fr.selectedIndex].value;
	to_currency = curr_to.options[curr_to.selectedIndex].value;

	getCode(curr_to.options[curr_to.selectedIndex]); //get currency code from db
	
	await getRatingOnline(from_currency, to_currency);

	amt = amnt_fr.value;
	let res = rating*amt;
	res = res.toFixed(2);


	disp.innerHTML = `<input type="text" id="CURR_VAL" readonly placeholder="${res} ${to_currency}" 
	style="background-color: #eee; font-weight: bold;" />`;

}

window.addEventListener('load', async e => {
	getRatingsOnline();

	//indexedDBSave();
	if('serviceWorker' in navigator){
		try {
			navigator.serviceWorker.register('sw.js');
			console.log("sw successfully regd");
		}
		catch(error){
			console.log("sw reg failed");
		}
	}
});

//get the current currency ratings online
async function getRatingOnline(from_currency = "USD", to_currency = "PHP"){
	let res = await fetch(`${src_web}/api/v5/convert?q=${from_currency}_${to_currency}&compact=ultra&apiKey`);
	let json = await res.json();
	let to_fr = `${from_currency}_${to_currency}`;
	rating = json[to_fr];
}

//called to get the ratings and currencies available online
async function getRatingsOnline(){
	getCurrencies(); 
	getRatingOnline(from_currency, to_currency);

}
async function getCurrencies(){
	let res = await fetch(`${src_web}/api/v5/currencies?apiKey`);
	let json = await res.json();
	let code = "";
	let index = 0;

	curr_json = JSON.stringify(json)
	
	index = curr_json.indexOf(`"id"`);
	currencies[0] = `${curr_json.charAt(index+6)}${curr_json.charAt(index+7)}${curr_json.charAt(index+8)}`;
	index++;

	for(let i=1; i<1000; i++){
		index = curr_json.indexOf(`"id"`,index);
		if(index !== -1){
			currencies[i] = `${curr_json.charAt(index+6)}${curr_json.charAt(index+7)}${curr_json.charAt(index+8)}`;
			index++;
		}
		else break;
	}

	indexedDBSave();
}

//create the indexed db and save the available currencies from the fetch
function indexedDBSave(){

	// Open (or create) the database
	let open = indexedDB.open("CurrencyConverter", 1);

	// Create the schema for the db
	open.onupgradeneeded = function() {
	    let db = open.result;
	    let store = db.createObjectStore("storeCurrency", {keyPath: "id"});
	    let index = store.createIndex("CurrencyIndex", ["currency.ind", "currency.code"]);
	};

	open.onsuccess = function() {
		console.log('db opened successfully');
	    // Start a new transaction
	    let db = open.result;
	    let tx = db.transaction("storeCurrency", "readwrite");
	    let store = tx.objectStore("storeCurrency");
	    let index = store.index("CurrencyIndex");
	    let cnt = 0;

	    // Add currency codes
	    for(code of currencies){
	    	store.put({id: cnt, currency: {ind: cnt, code: code}});
	    	cnt++;
	    }
	    
	}
	open.onerror = function(){
		console.log('db opening failed');
	}
	//close the db when transaction is done
	tx.oncomplete = function() {
        db.close();
    };

}

//get the currency code from db by supplying its index
function getCode(i){
	let open = indexedDB.open("CurrencyConverter", 1);
	open.onsuccess = function() {
    // Start a new transaction
    let db = open.result;
    let tx = db.transaction("storeCurrency", "readwrite");
    let store = tx.objectStore("storeCurrency");
    let index = store.index("CurrencyIndex");

    // Query the data
    let getCurrency = store.get(i);

    getCurrency.onsuccess = function() {
        console.log(getCurrency.result.currency.code);  // => "John"
    };

    // Close the db when the transaction is done
    tx.oncomplete = function() {
        db.close();
    };
}
}


