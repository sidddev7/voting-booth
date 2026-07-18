import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploys Election.sol. The deployer becomes `admin` and must then:
 * 1) setAdminSigner(backendSigner)
 * 2) addParty(...) for each ballot option
 * 3) startElection()
 */
export default buildModule("ElectionModule", (m) => {
  const election = m.contract("Election");
  return { election };
});
