
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

    console.log(GUARDS);
    console.log(res.insurance_service);
    console.log(res.travel_service);
    
    // Start simulating the main processes for the roles across the service 
    await run_service(res.insurance_service, res.travel_service);
}

const run_progress_only = async () => {
    GUARDS.set('ice_scooting', '0xf90546f060a5ddf9301e09cb47a2b2062df9494cf568fedc35eb3df97c82396b');
    GUARDS.set('cancel_ice_scooting', '0x17d7f3db3cc544c1892a2c8a6c6a3f7e0bee29225b7475f79146e81ec6b7dc84');
    GUARDS.set('complete_ice_scooting', '0x61124f21ca6d49c5d6abc86dc1d4aae865e6b10238c3f410906e879444aec020');
    const insurance_service: ServiceReturn = {service:'0x7daa98cc40bbd9f1d38a23a72f9035f3648f8a6c86c802bd8b25c2ba9afa7b5f',
        machine:'0x26546e7c2fcf7076f08cdc945a77478fd6d0684e822a65210f48aa890ee480cc'}
    const travel_service: ServiceReturn = {service:'0x60e4b7c4bcf9b8f8d9f90d8a71a9b898c775c099fa1c07e81202971649a1a51e', 
        machine:'0x4ad924a894241b6d557ba89e7136d573b715cab09380b1e73542b34b39c36b39'}
    await run_service(insurance_service, travel_service);
}

main().catch(console.error)