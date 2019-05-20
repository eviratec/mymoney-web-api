CREATE TABLE `transactions` (
  `Id` varchar(36) NOT NULL,
  `OwnerId` varchar(36) NOT NULL,
  `LogbookId` varchar(36) NOT NULL,
  `Summary` varchar(255) NOT NULL,
  `Amount` int(11) NOT NULL,
  `Created` int(11) NOT NULL,
  `Occurred` int(11) DEFAULT NULL,
  `Deleted` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `OwnerId` (`OwnerId`),
  KEY `LogbookId` (`LogbookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
