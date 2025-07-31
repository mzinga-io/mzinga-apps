import Admin from "./Admin";
import AlertTypes from "./AlertTypes";
import Alerts from "./Alerts";
import Collections from "./Collections";
import Communications from "./Communications";
import CustomEntities from "./CustomEntities";
import Files from "./Files";
import Media from "./Media";
import MediaGalleries from "./MediaGalleries";
import Owners from "./Owners";
import ScheduledTasks from "./ScheduledTasks";
import Stories from "./Stories";
import Tags from "./Tags";
import Users from "./Users";
import Videos from "./Videos";
const collections = [
  Users,
  Stories,
  Tags,
  Media,
  AlertTypes,
  Alerts,
  Files,
  Videos,
  MediaGalleries,
  Collections,
  CustomEntities,
  Communications,
  Owners.Organizations,
  Owners.Projects,
  Owners.Environments,
  Owners.Assets,
  Admin.RestartRequests,
  Admin.DBIndexes,
  ScheduledTasks.ScheduledTasks,
];
export { collections };
