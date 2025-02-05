import React, { useEffect, useState } from "react";
import Breadcrumbs from "../../core/breadcrumbs";
import { Table } from "antd";

const Customers = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/customers');
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const columns = [
    {
      title: "Customer Name",
      dataIndex: "userName",
      render: (text, record) => (
        <span style={{ 
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'normal',
          wordBreak: 'break-word'
        }}>
          <div className="avatar" style={{ width: '30px', height: '30px', marginRight: '10px' }}>
            <img 
              alt={text} 
              src={record.userPhotoUrl?.replace(/^\//, '') ?? "assets/img/avatar/avatar-16.png"}
            />
          </div>
          <span style={{ flex: 1 }}>{text}</span>
        </span>
      ),
      sorter: (a, b) => a.userName.localeCompare(b.userName),
    },
    {
      title: "Email",
      dataIndex: "userEmail",
      sorter: (a, b) => a.userEmail.localeCompare(b.userEmail),
    },
    {
      title: "Phone",
      dataIndex: "userPhone",
      sorter: (a, b) => a.userPhone.localeCompare(b.userPhone),
    },
    {
      title: "Address",
      dataIndex: "userAddress",
      sorter: (a, b) => a.userAddress.localeCompare(b.userAddress),
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumbs
          maintitle="Customer List"
          subtitle="Manage Your Customers"
        />

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <Table
                className="table datanew"
                columns={columns}
                dataSource={customers}
                rowKey={(record) => record.userID}
                bordered={true}
                pagination={true}
                size="middle"
                sticky={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
