CREATE TABLE `logbooks` (
  `Id` varchar(36) NOT NULL,
  `OwnerId` varchar(36) NOT NULL,
  `Name` varchar(45) NOT NULL,
  `Balance` int(11) NOT NULL DEFAULT '0',
  `Currency` enum('aud','usd','gbp','eur') DEFAULT 'usd',
  `Created` int(11) NOT NULL,
  `Deleted` int(11) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `OwnerId` (`OwnerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
