/*
NEAR Savings contract, save with NEAR tokens

Copyright Daniel Iwo, 2020
*/

import {context,storage,logging,PersistentMap,ContractPromise,u128} from 'near-sdk-as' 
import {TimeArgs,NearArgs} from './model'

const neartime_slow='neartime_slow.testnet';

export class Checkout{
	_expires:u64;
	_index:u64;
	to:string;
	_amount:u128;
}

export class Saving{
	release_time:u64;
	amount:u64;
	title:string;
	erc20:string;
}

export class TimeApi{
	getDate():ContractPromise{
		let promise=ContractPromise.create(neartime_slow,'getDate',[],0);
		return promise;
	}
}

export class NEARAPI{
	send(to: string,_amount:u128):ContractPromise{
		//let u_amt=u128.from(amount);
		let promise=ContractPromise.create(to,'',new Uint8Array(0),10000000000000,_amount);
		return promise;	
	}
}

//"amount" --save to amount, "time": save till time
const savings=new PersistentMap<u64, Saving>("s: ");

const expires=new PersistentMap<u64, u64>("e: ");
const target=new PersistentMap<u64, u128>("t: ");
const amount=new PersistentMap<u64, u128>("a: ");
const title=new PersistentMap<u64, string>("d: ");
const saver=new PersistentMap<u64,string>("u: ");

storage.set("count",0);

export function init(owner: string): void{
	logging.log("owner:  "+owner);
	storage.set("owner",context.sender);	
}

export function NewSaving(_title: string,_target:u128,_expires:u64): bool
{
	let count=storage.getSome<u64>("count");
	//u64 amt=context.attachedDeposit();
	target.set(count,_target);
	expires.set(count,_expires);
	saver.set(count,context.sender);
	amount.set(count,context.attachedDeposit);
	title.set(count,_title);
	let c=count+1
	storage.set<u64>("count",c);
	return true;
}

export function Deposit(_index:u64): bool
{
	let amt=amount.getSome(_index);
	amount.set(_index,context.attachedDeposit+u128.from(amt));
	return true;
}

export function Extend(_index:u64,_expires:u64): bool
{
	assert(context.sender==saver.getSome(_index));
	assert(expires.getSome(_index)<_expires);
	expires.set(_index,_expires);
	return true;
}

export function Increase(_index:u64,_target:u128): bool
{
	assert(context.sender==saver.getSome(_index));
	assert(target.getSome(_index)<_target);
	target.set(_index,_target);
	return true;
}

export function Withdraw(_index:u64,_amount:u128,to:string): bool
{
	assert(context.sender==saver.getSome(_index));
	let amt=amount.getSome(_index);
	let tgt=target.getSome(_index);
	if(tgt>u128.from(0))
	{
		assert(amt>=tgt);
		_payout(_index,to,_amount);	
		return true;
	}
	else{
		let _expires=expires.getSome(_index);
		let timeapi=new TimeApi();
		let ts=timeapi.getDate();
		let itemArgs: Checkout={"_expires":_expires,"_index":_index,"to":to,"_amount":_amount};
		//let ia=encode<Uint8Array>(itemArgs);
		let cbPromise=ts.then(
			context.contractName,
			"_checkTime",
			itemArgs.encode(),
			2
		);
		cbPromise.returnAsResult();
	}
	return false;
}

function _payout(_index:u64,to:string,amt:u128):void
{
	let nearapi=new NEARAPI();
	let promise=nearapi.send(to,amt);
	promise.returnAsResult();
}

function _checkTime(_expires:u64,_index:u64,to:string,_amount:u128):u64
{
	let results=ContractPromise.getResults();
	let _time=results[0];
	if(_time.status==1){
		let u64time=decode<u64>(_time.buffer);
		logging.log("time "+u64time);
		if(u64time<_expires)
		{
			logging.log("Payout after "+u64time.toString()+" of "+_expires.toString());
			_payout(_index,to,_amount);		
		}	
	}
}

/*function _getTime():u64
{
	let timeapi=new TimeApi();
 	let ts=timeapi.getDate();
 	let res=ContractPromise.getResults();
 	if(res[0].success)
 	{
		return <u64>res[0].buffer; 	
 	}
 	//ts.returnAsResult();
	//let ts=await timestamp;
	let results=ts.getResults();
	if(results[0].success)
	{
		//convert to u64
		return <u64>results[0].buffer;
	}
	return 9007199254740991;
}*/

function _norm(amt:u64): u64
{
	return 1;
}

export function setNorm(perc:u64): bool
{
	return true;
}