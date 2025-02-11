import React from "react";
import * as Icon from "react-feather";
import { authService } from "../../services/authService";

const getAllMenus = () => [
  {
    label: "Main",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Main",
    submenuItems: [
      {
        label: "Dashboard",
        icon: <Icon.Grid />,
        submenu: false,
        showSubRoute: false,
        link: "/"
      },
      {
        label: "Application",
        icon: <Icon.Smartphone />,
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Chat", link: "/chat", showSubRoute: false },
          { label: "To Do", link: "/todo", showSubRoute: false }
        ],
      },
    ],
  },
  {
    label: "Inventory",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Inventory",

    submenuItems: [
      {
        label: "Products",
        link: "/product-list",
        icon: <Icon.Box />,
        showSubRoute: false,
        submenu: false,
      }
    ]
  },
  {
    label: "Orders",
    submenuOpen: true,
    submenuHdr: "Orders",
    submenu: false,
    showSubRoute: false,
    submenuItems: [
      {
        label: "Orders",
        link: "/sales-list",
        icon: <Icon.ShoppingCart />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Invoices",
        link: "/invoice-report",
        icon: <Icon.FileText />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Payment History",
        link: "/payment-history",
        icon: <Icon.Copy />,
        showSubRoute: false,
        submenu: false,
      }
    ],
  },
  {
    label: "Income & Expenses",
    submenuOpen: true,
    submenuHdr: "Purchases",
    showSubRoute: false,
    submenuItems: [
      {
        label: "Expenses",
        link: "/expense-list",
        submenu: false,
        showSubRoute: false,
        icon: <Icon.FileText />,
      },    
      {
        label: "Income-Expense Ledger",
        link: "/accounts-ledger",
        icon: <Icon.TrendingDown />,
        showSubRoute: false,
      },
    ],
  },

  {
    label: "People",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "People",

    submenuItems: [
      {
        label: "Customers",
        link: "/customers",
        icon: <Icon.User />,
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Employees",
        link: "/employees-grid",
        icon: <Icon.Users />,
        showSubRoute: false,
      }
    ],
  },
  {
    label: "Help",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Help",
    submenuItems: [
      {
        label: "Documentation",
        link: "#",
        icon: <Icon.FileText />,
        showSubRoute: false,
      },
      {
        label: "Changelog v2.0.3",
        link: "#",
        icon: <Icon.Lock />,
        showSubRoute: false,
      },
    ],
  },
];

const getDeliveryManMenu = () => [
  {
    label: "Main",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Main",
    submenuItems: [
      {
        label: "Dashboard",
        icon: <Icon.Grid />,
        submenu: false,
        showSubRoute: false,
        link: "/delivery-dashboard"
      }
    ],
  }
];

// export const SidebarData = (() => {
//   const employee = authService.getCurrentEmployee();
  
//   if (employee?.designation === 'Delivery Man') {
//     return getDeliveryManMenu();
//   }
  
//   return getAllMenus();
// })();

export const getSidebarData = () => {
  const employee = authService.getCurrentEmployee();
  
  if (employee?.designation === 'Delivery Man') {
    return getDeliveryManMenu();
  }
  
  return getAllMenus();
};
