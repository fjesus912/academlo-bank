import { UserService } from '../users/users.service.js';
import { TransferService } from './transfers.service.js';

export const makeTransfer = async (req, res) => {
  try {
    const { amount, recipientAccountNumber, senderAccountNumber } = req.body;

    const recipientUserPromise = UserService.findOneAccount(
      recipientAccountNumber
    );

    const senderUserPromise = UserService.findOneAccount(senderAccountNumber);

    const [recipientUser, senderUser] = await Promise.all([
      recipientUserPromise,
      senderUserPromise,
    ]);

    if (!recipientUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Recipient account does not exist',
      });
    }

    if (!senderUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Sender account does not exist',
      });
    }

    if (amount > senderUser.amount) {
      return res.status(400).json({
        status: 'error',
        message: 'insufficient balance',
      });
    }

    const newRecipientBalance = amount + recipientUser.amount;
    const newSenderBalance = senderUser.amount - amount;

    const updateSenderUserPromise = UserService.updateAmount(
      senderUser,
      newSenderBalance
    );
    const updateRecipientUserPromise = UserService.updateAmount(
      recipientUser,
      newRecipientBalance
    );
    const transferPromise = TransferService.createRecordTransfer(
      amount,
      senderUser.id,
      recipientUser.id
    );

    await Promise.all([
      updateSenderUserPromise,
      updateRecipientUserPromise,
      transferPromise,
    ]);

    res.status(201).json({
      message: 'successful transfer',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};
