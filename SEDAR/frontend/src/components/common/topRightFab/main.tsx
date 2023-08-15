import Fab from "@material-ui/core/Fab";
import { withStyles } from "@material-ui/core/styles";

const TopRightFab = withStyles({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
  },
})(Fab);

export default TopRightFab;
