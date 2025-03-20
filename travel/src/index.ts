
import { sleep, PAY_TYPE, PUBKEY, launch, check_account, BUYER_ACCOUNT, ServiceReturn, GUARDS,  } from './common'
import { insurance } from './service_insurance';
import { weather } from './weather';
import { travel, TRAVEL_MACHINE_NODE } from './service_travel';
import { run_service } from './run'

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

    //await run_service_progress();
    await run_progress()
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
    GUARDS.set('ice_scooting', '0xedfafef895216f577a6cf0a85ca09c89d0344d2940a8df46511e7b35e8291a79');
    GUARDS.set('cancel_ice_scooting', '0x64dc28b2f1c46e8e5755f94947f2858595a9d9847d5dcb786bf121af2fef4af7');
    GUARDS.set('complete_ice_scooting', '0x9f76574bb349169c3e820d4954967b8f36e8fac1a052e19fda9c8c72cb9af4c3');
    const insurance_service: ServiceReturn = {service:'0xb3d691aeef55409eb78f2c2e0f28a0f60c6602fd805c9c8d74e6920c6b2689ac', machine:'0xa97142e7340af21aa9723f0ab80b1f2d64270692815577f1efb1ece764d7899b', permission:'0x6c14042cbdafdc2058af2f09c3a2b0ed982b3e8ae1aec0705d3d98ae2134c750'}
    const travel_service: ServiceReturn = {service:'0x900288c808a565b43bfbb1b9afb3f04ff58cdffb96254a55d7735c01e4de634e', machine:'0xc401328706e4c8fb653fd13a01bac70b11a88ea75b5b519645abd6b3d5094fda', permission:'0x5e09c0dd2c3d91544bc062cb6915507276432d7930aa0f5abfba30b0d518a992'}
    await run_service(insurance_service, travel_service);
}

main().catch(console.error)