export const INDEX_ROUTE = "/users";

export const MenuRoutes = [
  {
    parentName: null,
    parentGuid: null,
    displayOrder: 0,
    uri: "users",
    iconUri: "fa-user",
    recordGuid: "1",
    position: 100,
    group: 1,
    menuDetail: [
      {
        name: "Users",
        description: "Users",
        languageCode: "en",
      },
    ],
  },
  {
    parentName: null,
    parentGuid: null,
    displayOrder: 1,
    uri: "devices",
    iconUri: "fa-mobile",
    recordGuid: "2",
    position: 100,
    group: 1,
    menuDetail: [
      {
        name: "Devices",
        description: "Devices",
        languageCode: "en",
      },
    ],
    menuAction: [
      {
        recordGuid: "4",
        menuActionDetail: [
          {
            name: "View",
            description: "View",
            languageCode: "en",
          },
        ],
        hasAccess: true,
      },
    ],
  },
  {
    parentName: null,
    parentGuid: null,
    displayOrder: 2,
    uri: "orders",
    iconUri: "fa-file-invoice-dollar",
    recordGuid: "3",
    position: 100,
    group: 1,
    menuDetail: [
      {
        name: "Orders",
        description: "Orders",
        languageCode: "en",
      },
    ],
  },
  {
    parentName: null,
    parentGuid: null,
    displayOrder: 3,
    uri: "contact-us",
    iconUri: "fa-phone",
    recordGuid: "4",
    position: 100,
    group: 1,
    menuDetail: [
      {
        name: "Contact Us",
        description: "Contact Us",
        languageCode: "en",
      },
    ],
  },
  {
    parentName: null,
    parentGuid: null,
    displayOrder: 3,
    uri: "bundles",
    iconUri: "fa-sim-card",
    recordGuid: "5",
    position: 100,
    group: 1,
    menuDetail: [
      {
        name: "Bundles",
        description: "Bundles",
        languageCode: "en",
      },
    ],
  },
];
