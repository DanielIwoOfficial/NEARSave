/*
NEAR Savings contract, save with NEAR tokens

Copyright Daniel Iwo, 2020
*/

import {context,storage,logging,PersistentMap,ContractPromise,u128} from 'near-sdk-as' 
import {TimeArgs,NearArgs} from './model'

const neartime_slow='neartime_slow.testnet';

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
		let promise=ContractPromise.create(to,'',[],10000000000000,_amount);
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


export function init(owner: string): void{
	logging.log("owner:  "+owner);
	storage.set("owner",context.sender);	
}

/*export function NewSaving(title: string,_target:u128,_expires:u64): bool
{
	u64 count=storage.get("count");
	//u64 amt=context.attachedDeposit();
	target.set(count,_target);
	expires.set(count,_expires);
	saver.set(count,context.sender);
	amount.set(count,context.attachedDeposit);
	title.set(count,_title);
	let c=count+1
	storage.set("count",c);
	return true;
}*/

export function Deposit(_index:u64): bool
{
	let amt=amount.get(_index);
	amount.set(_index,context.attachedDeposit+u128.from(amt));
	return true;
}

export function Extend(_index:u64,_expires:u64): bool
{
	assert(context.sender==saver.get(_index));
	assert(expires.get(_index)<_expires);
	expires.set(_index,_expires);
	return true;
}

export function Increase(_index:u64,_target:u128): bool
{
	assert(context.sender==saver.get(_index));
	assert(target.get(_index)<_target);
	target.set(_index,_target);
	return true;
}

export function Withdraw(_index:u64,_amount:u128,to:string): bool
{
	assert(context.sender==saver.get(_index));
	let amt=u128.from(amount.get(_index));
	if(amt>u128.from(0))
	{
		assert(amt>=u128.from(target.get(_index)));
		_payout(_index,to,_amount);	
		return true;
	}
	else if(_getTime()>expires.get(_index))
	{
		_payout(_index,to,_amount);	
		return true;
	}
	return false;
}

function _payout(_index:u64,to:string,amt:u128):void
{
	/*let nearapi=new NEARAPI();
	let promise=nearapi.send(to,amt);
	promise.returnAsResult();*/
}

function _getTime():u64
{
	/*let timeapi=new TimeApi();
	let ts=timeapi.getDate();
	//let ts=await timestamp;
	let results=ts.getResults();
	if(results[0].success)
	{
		//convert to u64
		return <u64>results[0].buffer;
	}*/
	return 9007199254740991;
}

function _norm(amt:u64): u64
{
	return 1;
}

export function setNorm(perc:u64): bool
{
	return true;
}