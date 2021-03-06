/**
* MIT License
*
* Copyright (c) 2020 Code Particle Inc.
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
/**
 * @fileoverview Coin agnostic wallet actions
 * @author Gabriel Womble
 */
import { BlockchainManager } from 'coins';
import { asyncForEach, satoshiToFloat } from 'lib/utils';
import { BIP32 } from 'coins/bitcoin/constants';

export class WalletManager {
  constructor(manager) {
    this.manager = manager;
    this.blockchainManager = BlockchainManager;
  }

  getDefaultFee() {
    return this.blockchainManager.defaultFee;
  }

  /**
   * Function that adds a new wallet to the db
   * @param {Object} wallet - the wallet object to add to the db
   */
  async createWallet(wallet) {
    await this.manager.databaseManager.insert(false).wallet(wallet);
    const { address, privateKey: private_key, index } = this.blockchainManager.generateAddressFromSeed(wallet.seed);
    const address_index = index;
    const insertedWallet = await this.manager.databaseManager.getLastWallet();

    await this.manager.databaseManager.insert().address({
      address,
      private_key,
      wallet_id: insertedWallet.id,
    });
    await this.manager.databaseManager.updateWalletById(insertedWallet.id, { address_index });
    await this.manager.saveDatabase();
  }

  /**
   * Function that is called on a polling interval in CryptoPoller
   * Gets addresses from DB, and then compares their balances against the
   * balances retrieved by the blockchainManager's fetchAddressDetails (api) call
   * @returns {Boolean} - true if a balance was updated, false if not.
   */
  async pollAddressData() {
    const addresses = await this.manager.databaseManager.getAddresses();
    let hasUpdates = false;

    // Loop through addresses & compare against api values.
    await asyncForEach(addresses, async (address) => {
      const {
        balance: newBalance,
        transactions,
      } = await this.blockchainManager.fetchAddressDetails(address.address);

      this.manager.transactionManager.updateIncomingTransactions(transactions, address);

      if (typeof newBalance === 'number') {
        const newFormatted = satoshiToFloat(newBalance);

        if (newFormatted !== address.balance) {
          hasUpdates = true;
          const { id } = address;
          const balance = newFormatted;

          await this.manager.databaseManager.updateAddressById(id, { balance });
        }
      }

    });

    if (hasUpdates) {
      this.manager.saveDatabase();
    }

    return hasUpdates;
  }

  /**
   * Function that generates deterministic pass phrase
   * @returns {Array} Secret Phrase
   * @param {String} locale - locale code to determine wordlist to use
   */
  generateSecretPhrase(locale) {
    return this.blockchainManager.phraseToArray(this.blockchainManager.generateSecretPhrase(locale));
  }

  /**
   * This method creates a new address and
   * Transfers the balance left from the old address to the new one.
   * @param {string} addressParam.
   */
  async refreshAddress(wallet, addressParam) {
    const { address, index, privateKey } = await this.blockchainManager.refreshAddress(wallet, addressParam);
    const private_key = privateKey;
    const address_index = index;
    await this.manager.databaseManager.updateAddressById(addressParam.id, { address, private_key });
    await this.manager.databaseManager.updateWalletById(wallet.id, { address_index });
    await this.manager.saveDatabase();
  }

  /**
   * This method creates a new address and adds it to a multi-address wallet .
   * @param {obj} wallet.
   * @param {string} address's nickname.
   */
  async addAddress(wallet, nickname) {
    const currentAddressIndex = wallet.address_index === null ? 1 : wallet.address_index;
    const { address, privateKey: private_key, index } = this.blockchainManager.generateAddressFromSeed(wallet.seed, 0,  BIP32.CHANGE_CHAIN.EXTERNAL, currentAddressIndex);
    const address_index = index;
    await this.manager.databaseManager.insert().address({
      address,
      private_key,
      name: nickname,
      wallet_id: wallet.id,
    });
    await this.manager.databaseManager.updateWalletById(wallet.id, { address_index });
    await this.manager.saveDatabase();
  }

  /**
   * This method deletes and address from db if it has a balance of 0.
   * @param {obj} address.
   */
  async deleteAddress(address) {
    const { balance } =  await this.blockchainManager.fetchAddressDetails(address.address);

    if (balance === 0) {
      await this.manager.databaseManager.deleteAddressById(address.id);
      await this.manager.saveDatabase();
      return true;
    }

    return false;
  }
}
