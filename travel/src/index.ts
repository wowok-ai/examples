
import { sleep, PAY_TYPE, PUBKEY, result, check_account, BUYER_ACCOUNT, ServiceReturn, GUARDS,  } from './common'
import { insurance } from './service_insurance';
import { Weather, weather } from './weather';
import { travel, TRAVEL_MACHINE_NODE } from './service_travel';
import { run_service } from './run'
import { Account } from 'wowok_agent';

const service = async () : Promise<{insurance_service:ServiceReturn, travel_service: ServiceReturn}> => {
    // service
    const service_insurance = await insurance();
    const repository_weather = await weather();
    const service = await travel(repository_weather, [service_insurance.service]);
    
    console.log('build services success')
    return {insurance_service:service_insurance, travel_service:service}
}



const main = async () => {
    await check_account();
    await check_account(BUYER_ACCOUNT);
    console.log('Account list: ' + JSON.stringify(await Account.Instance().list()));
    console.log('Default Account ' + ':' + JSON.stringify(await Account.Instance().default()));

    //await run_service_progress();
    await run_progress_only()
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

const run_progress_only = async () => {
    GUARDS.set('ice_scooting', '0xf06c2eb446ec96b442a8889b65ec5fc18a84f5adc7207fda9f9ac55e73ffabea');
    GUARDS.set('cancel_ice_scooting', '0x01a01f6e10f7bd444a9f09181f19d298ad4ee2bcac32e0437cc768c6a81fb6eb');
    GUARDS.set('complete_ice_scooting', '0xea40855d27960a6af0dfb869730fd8a6cc8665eebae43ced2624907f7c1ebd3e');
    const insurance_service: ServiceReturn = {service:'0xf5ed69241a2a5e2e46f96972fb23f6352047282150ebdf6bfd9ee6ff80c9e4e1', 
        machine:'0x2a82662598b94df9f7463df86699c2a21efc4f8896ac35a72f21e339347fa48c', 
        permission:'0xe7176323c04f7b2ee8d29012a2847b5258fb0258c657d27757bd68a8790ec95b'}
    const travel_service: ServiceReturn = {service:'0x992a3e00fd2d7d83a766e82bdfbd512f2b786ec52a0d67b06ad5988ce0c529bb', 
        machine:'0xae590b273bff608bc14760fcc0ed3fc5034f46844eea19e1c3116ce34889a6d0', 
        permission:'0x7314628c4ff8e5030c5a245d4ab7dc13b831870f48f16ab0b45c819e7d64b4bf'}
    await run_service(insurance_service, travel_service);
}

main().catch(console.error)