
import { sleep, PAY_TYPE, PUBKEY, launch, check_account, BUYER_ACCOUNT, ServiceReturn, GUARDS,  } from './common'
import { insurance } from './service_insurance';
import { weather } from './weather';
import { travel, TRAVEL_MACHINE_NODE } from './service_travel';
import { run_service } from './run'
import { WOWOK } from 'wowok_agent';

const service = async () : Promise<{insurance_service:ServiceReturn, travel_service: ServiceReturn}> => {
    // service
    const service_insurance = await insurance();
    const repository_weather = await weather();
    const service = await travel(repository_weather, [service_insurance.service]);
    
    console.log('build services success')
    return {insurance_service:service_insurance, travel_service:service}
}

const main = async () => {
    /*const time = WOWOK.getUTCDayStartByDivision();
    const addr = WOWOK.Bcs.getInstance().ser(WOWOK.ValueType.TYPE_ADDRESS, time + 24*60*60*1000); 
    console.log(addr)
    const date = new Date();  
    console.log(date.getTime())
    date.setHours(0, 0, 0, 0);  
    console.log(date.getTime())
    console.log(getUTCDayStartByDivision());*/

    await check_account();
    await check_account(BUYER_ACCOUNT);

    await run_service_progress();
    //await run_progress()
}  

const run_service_progress = async () => {
    const res = await service();
    console.log('build services success');
    console.log(GUARDS);
    console.log(res.insurance_service);
    console.log(res.travel_service);
    
    // Start simulating the main processes for the roles across the service 
    await run_service(res.insurance_service, res.travel_service);
}

const run_progress = async () => {
    GUARDS.set('ice_scooting', '0xf420afe1263e954c1b45394611939e1ba732e9de6608a6b003a4c02ea293bb50');
    GUARDS.set('cancel_ice_scooting', '0xd1a11a4232787af932897541aff40823a21b1c28e42de3161cd7323e510e250b');
    GUARDS.set('complete_ice_scooting', '0x13afd6fb7aa30000a7984b458ea86869ee19726504bba1eadf6f82e50f0bc1e7');
    const insurance_service: ServiceReturn = {service:'0xcb9953e8c7b4344e4ea07b48ea7a90ddff8b3ff8797697aa333e0a819e32544b', machine:'0x32dcf57c2d075680fce1d0a39fa5cdbf34aa6aa16c659a4900bb18b6d539c509', permission:'0xb80f1bf4e04e1331a3cb8750331991018c07dd2504a384bf3b5b49a49faa4efc'}
    const travel_service: ServiceReturn = {service:'0x54ea710a76dd982398617dbb895092a95c096baad3c7804cd3f7df50c9b18564', machine:'0x01a370052469e2e4371b448d0571e2390d32feb051cafa4c7ec425e836ce173b', permission:'0xd9dcc8a958519e5649cd12ac89663f0aa638910e31717e3af7e9ee9a03488cca'}
    await run_service(insurance_service, travel_service);
}

main().catch(console.error)