import React, {useState} from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { IconButton } from '@material-ui/core';

/**
* Scroll button component sligthly changed from https://www.geeksforgeeks.org/how-to-create-a-scroll-to-top-button-in-react-js/.
*/
const ScrollBackToTopButton = () =>{
  
  const [visible, setVisible] = useState(false)
  
  const toggleVisible = () => {
    const scrolled = document.documentElement.scrollTop;
    if (scrolled > 300){
      setVisible(true)
    } 
    else if (scrolled <= 300){
      setVisible(false)
    }
  };
  
  const scrollToTop = () =>{
    window.scrollTo({
      top: 0, 
      behavior: 'smooth'
    });
  };
  
  window.addEventListener('scroll', toggleVisible);
  
  return (
    <IconButton style={{position: "fixed", 
        right: "50%",
        bottom: "2rem",
        minHeight: "40px",
        minWidth: "40px",
        zIndex: "1",
        backgroundColor: "white",
        border: "2px solid",
        display: visible ? 'inline' : 'none'}} onClick={scrollToTop}>
        <ArrowUpwardIcon style={{color:'black'}}/>
    </IconButton>
  );
}
  
export default ScrollBackToTopButton;