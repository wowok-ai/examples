
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

    await run_service_progress();
    //await run_progress_only()
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
    GUARDS.set('ice_scooting', '0x0713c6d7e6e66c2d1a414270207a09b19cb98211c1ded48e6814183a14451d6a');
    GUARDS.set('cancel_ice_scooting', '0x92284108960db1e44646a2f2ff9c54b4037d184a98e7e923f8e34d3c94705db2');
    GUARDS.set('complete_ice_scooting', '0x77d15b99e228dd82ee13d4fadc2ac688be4f2641865dd7efd04b6f148f0e9950');
    const insurance_service: ServiceReturn = {service:'0xc876d3aca727422a97ce038b7d00494635323d9d8526b14178cff096bfec84cb',
        machine:'0xba92cae06675231a6288dfbb0e874a49e32c32e0f3413902f6514cdfdeebc53f'}
    const travel_service: ServiceReturn = {service:'0x3e04af89d36ba6a8af8d9e0895cb8e9adf49d83ecfd0bc5f43342bef09554706', 
        machine:'0xf8b02ca29b47e77fc312e2229941ed24890c5e999ec825937bb34d66c02851ff'}
    await run_service(insurance_service, travel_service);
}

main().catch(console.error)