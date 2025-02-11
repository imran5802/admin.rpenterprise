import React, { useState, useEffect } from "react";
import axios from "axios";
// import { DatePicker } from "antd";
import Breadcrumbs from "../../core/breadcrumbs";
// const { RangePicker } = DatePicker;
import { Table } from "antd";
import dayjs from "dayjs";

const AccountsLedger = () => {
  // const [dateRange, setDateRange] = useState(null);
  // const [enableDateFilter, setEnableDateFilter] = useState(false);  // Add this line
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/accounts`
      );
      if (response.data.success) {
        setAccounts(response.data.accounts);
      }
    } catch (err) {
      setError("Failed to fetch accounts data");
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateRunningBalance = (accounts) => {
    let balance = 0;
    return accounts.map(account => {
      const credit = Number(account.credit) || 0;
      const debit = Number(account.debit) || 0;
      balance += credit - debit;
      return {
        ...account,
        credit,
        debit,
        balance
      };
    });
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Account Name',
      dataIndex: 'account_name',
      key: 'account_name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Credit',
      dataIndex: 'credit',
      key: 'credit',
      render: (credit) => Number(credit) === 0 ? '-' : `৳${Number(credit).toFixed(2)}`,
    },
    {
      title: 'Debit',
      dataIndex: 'debit',
      key: 'debit',
      render: (debit) => Number(debit) === 0 ? '-' : `৳${Number(debit).toFixed(2)}`,
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => (
        <span className={balance >= 0 ? 'text-success' : 'text-danger'}>
          ৳{Math.abs(balance).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumbs
          maintitle="Accounts Ledger"
          subtitle="Manage Your Accounts"
        />
        <div className="card table-list-card border-0 mb-0">
          <div className="card-body mb-3">
            <div className="table-top mb-0 profit-table-top"></div>
          </div>
        </div>
        <div className="table-responsive">
          <Table
            columns={columns}
            dataSource={calculateRunningBalance(accounts)}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            locale={{
              emptyText: error ? error : 'No accounts data found'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountsLedger;
