import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SubAccount {
  id: string;
  name: string;
  description?: string;
  balance: number;
  currency: string;
  permissions: {
    view: boolean;
    send: boolean;
    receive: boolean;
    convert: boolean;
  };
  created_at: string;
  is_active: boolean;
}

export interface SubAccountTransaction {
  id: string;
  sub_account_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export const useSubAccounts = () => {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [transactions, setTransactions] = useState<SubAccountTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock data for demonstration
  useEffect(() => {
    const mockSubAccounts: SubAccount[] = [
      {
        id: '1',
        name: 'Family Account',
        description: 'Shared family expenses',
        balance: 15000,
        currency: 'KES',
        permissions: { view: true, send: true, receive: true, convert: false },
        created_at: '2024-01-15T10:00:00Z',
        is_active: true,
      },
      {
        id: '2',
        name: 'Business Account',
        description: 'Business operations',
        balance: 45000,
        currency: 'KES',
        permissions: { view: true, send: true, receive: true, convert: true },
        created_at: '2024-02-01T10:00:00Z',
        is_active: true,
      },
      {
        id: '3',
        name: 'Savings Pool',
        description: 'Emergency fund',
        balance: 25000,
        currency: 'KES',
        permissions: { view: true, send: false, receive: true, convert: false },
        created_at: '2024-02-15T10:00:00Z',
        is_active: true,
      },
    ];

    const mockTransactions: SubAccountTransaction[] = [
      {
        id: '1',
        sub_account_id: '1',
        type: 'deposit',
        amount: 5000,
        currency: 'KES',
        description: 'Monthly allowance',
        status: 'completed',
        created_at: '2024-03-01T10:00:00Z',
      },
      {
        id: '2',
        sub_account_id: '2',
        type: 'transfer',
        amount: 10000,
        currency: 'KES',
        description: 'Business expense',
        status: 'completed',
        created_at: '2024-03-02T14:30:00Z',
      },
      {
        id: '3',
        sub_account_id: '3',
        type: 'deposit',
        amount: 3000,
        currency: 'KES',
        description: 'Emergency fund contribution',
        status: 'pending',
        created_at: '2024-03-03T09:15:00Z',
      },
    ];

    setSubAccounts(mockSubAccounts);
    setTransactions(mockTransactions);
  }, []);

  const createSubAccount = async (accountData: Omit<SubAccount, 'id' | 'created_at' | 'balance'>) => {
    setLoading(true);
    try {
      const newAccount: SubAccount = {
        ...accountData,
        id: Date.now().toString(),
        balance: 0,
        created_at: new Date().toISOString(),
      };
      
      setSubAccounts(prev => [...prev, newAccount]);
      
      toast({
        title: "Sub-account Created",
        description: `${accountData.name} has been created successfully.`,
      });
      
      return { success: true, data: newAccount };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sub-account. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const transferFunds = async (fromAccount: string, toAccount: string, amount: number, description: string) => {
    setLoading(true);
    try {
      // Update balances
      setSubAccounts(prev => prev.map(account => {
        if (account.id === fromAccount) {
          return { ...account, balance: account.balance - amount };
        }
        if (account.id === toAccount) {
          return { ...account, balance: account.balance + amount };
        }
        return account;
      }));

      // Add transaction record
      const newTransaction: SubAccountTransaction = {
        id: Date.now().toString(),
        sub_account_id: fromAccount,
        type: 'transfer',
        amount,
        currency: 'KES',
        description,
        status: 'completed',
        created_at: new Date().toISOString(),
      };

      setTransactions(prev => [newTransaction, ...prev]);

      toast({
        title: "Transfer Successful",
        description: `KES ${amount.toLocaleString()} transferred successfully.`,
      });

      return { success: true };
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: "Failed to complete the transfer. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updatePermissions = async (accountId: string, permissions: SubAccount['permissions']) => {
    setLoading(true);
    try {
      setSubAccounts(prev => prev.map(account => 
        account.id === accountId ? { ...account, permissions } : account
      ));

      toast({
        title: "Permissions Updated",
        description: "Sub-account permissions have been updated successfully.",
      });

      return { success: true };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deactivateSubAccount = async (accountId: string) => {
    setLoading(true);
    try {
      setSubAccounts(prev => prev.map(account => 
        account.id === accountId ? { ...account, is_active: false } : account
      ));

      toast({
        title: "Account Deactivated",
        description: "Sub-account has been deactivated successfully.",
      });

      return { success: true };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate account. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    subAccounts: subAccounts.filter(account => account.is_active),
    transactions,
    loading,
    createSubAccount,
    transferFunds,
    updatePermissions,
    deactivateSubAccount,
  };
};