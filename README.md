# SEDAR: A Semantic Data Reservoir for Heterogeneous Datasets
Data lakes have emerged as a solution for managing vast and diverse datasets for modern data analytics. To prevent them from becoming ungoverned, semantic data management techniques are crucial, which involve connecting metadata with knowledge graphs, following the principles of Linked Data. This semantic layer enables more expressive data management, integration from various sources and enhances data access utilizing the concepts and relations to semantically enrich the data. Some frameworks have been proposed, but requirements like data versioning, linking of datasets, managing machine learning projects, automated semantic modeling and ontology-based data access are not supported in one uniform system. We demonstrate SEDAR, a comprehensive semantic data lake that includes support for data ingestion, storage, processing, and governance with a special focus on semantic data management. The demo will showcase how the system allows for various ingestion scenarios, metadata enrichment, data source linking, profiling, semantic modeling, data integration and processing inside a machine learning life cycle.

 ## [Demo Video](https://data-science.hsnr.de/SEDAR-CIKM.mp4)

## Publications
- [SEDAR: A Semantic Data Reservoir for Heterogeneous Datasets](https://doi.org/10.1145/3583780.3614753)
- [SEDAR: A Semantic Data Reservoir for Integrating Heterogeneous Datasets and Machine Learning](https://ercim-news.ercim.eu/images/stories/EN133/EN133-web.pdf) (Page 27)

## Cite this work:
Sayed Hoseini, Ahmed Ali, Haron Shaker, and Christoph Quix. 2023. SEDAR: A Semantic Data Reservoir for Heterogeneous Datasets. In Proceedings of the 32nd ACM International Conference on Information and Knowledge Management (CIKM ’23), October 21–25, 2023, Birmingham, United Kingdom. ACM, New York, NY, USA, 5 pages. https://doi.org/10.1145/3583780.3614753

```bib
@inproceedings{...,
  title={A Semantic Data Reservoir for Integrating Heterogeneous Datasets},
  author={},
  booktitle={},
  pages={},
  year={2023},
  doi={},
  organization={}
}
```
## Contact
For any setup difficulties or other inquiries, please contact: data-science@hsnr.de 

License
-------

This project is openly shared under the terms of the __Apache License
v2.0__ ([read for more](./LICENSE)).

## Acknowledgement

We acknowledge the cooperation with A. Martin, M. Thiel, R. Kuller, L. Beer, F. Lentzen, F. Bongartz, M. Noman, T. Claas, M. Fallouh, Z. Abdullah gratefully who made this work possible. 
This work has been sponsored by the German Federal Ministry of Education and Research, Germany in the funding program “Forschung an Fachhochschulen”, project \href{https://www.hs-niederrhein.de/i2dach}{$I^2DACH$} (grant no. 13FH557KX0).


## Overview

This is a figure that represents the architecture of the system. All individual elements are shipped in Docker containers.

![](documents/sedar-architektur.jpg)

# Installation
The following installation instruction have been tested on a Debian virtual machine with 32GB RAM and 8 CPUs.

### Virtual Machine Specifications
        Description:    Debian GNU/Linux 11 (bullseye)
        System:         Linux datalake106 5.15.74-1-pve #1 SMP PVE 5.15.74-1 (Mon, 14 Nov 2022 20:17:15 +0100) x86_64 GNU/Linux
        Architecture:   x86_64
        CPU Model name: Intel(R) Xeon(R) Silver 4114 CPU @ 2.20GHz
        Mem:            Total: 30Gi        Used: 18Gi


1. Install the following via terminal. <br />
    * Git: <br />
            
                apt-get install git curl build-essential gcc ffmpeg libsm6 libxext6  -y

        - Clone the repository: <br />
            
                git clone https://github.com/hsnr-data-science/SEDAR.git

    * Docker : <br />
    An installation guide for Docker can also be found at:
            https://docs.docker.com/desktop/install/linux-install/ <br />
        - Setup the repository, update the apt package index and install packages to allow apt to use a repository over HTTPS:<br />
            
                sudo apt-get update
                sudo apt-get install ca-certificates curl gnupg

        - Add Docker’s official GPG key: <br />
                
                sudo install -m 0755 -d /etc/apt/keyrings 
                curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc apt/keyrings/docker.gpg 
                sudo chmod a+r /etc/apt/keyrings/docker.gpg

        - Use the following command to set up the repository: <br />
            
                echo \ "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux debian \ "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \ sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    * Docker Engine: <br />
        - Update the apt package index: <br />
            
                sudo apt-get update

        - Install Docker Engine, containerd, and Docker Compose. To install the latest version, run: <br />
            
                sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
        - Verify that the Docker Engine installation is successful by running the hello-world image: <br />
            
                sudo docker run hello-world
          <br />

           Continue to [Linux postinstall](https://docs.docker.com/engine/install/linux-postinstall/) to allow non-privileged users to run Docker commands and for other optional configuration steps. <br /> 
    
    * NVM (Node Version Manager) <br />
        With NVM it is much easier to make changes in NodeJS and npm.
        
                curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 

                source ~/.bashrc

    * npm and NodeJS: <br />
        - Install npm and Node.js by using NVM. <br />
                
                nvm install v18.16.0 
        
        -  Use this to check which Node.js version you installed. <br />
                
                node -v && npm --version

        - execute this command below to be able to use npm without sudo on port 80.
                
                sudo setcap 'cap_net_bind_service=+ep' `which node`
        
        - installation guide for NodeJS can also be found at this site: <br />
            https://www.knowledgehut.com/blog/web-development/install-nodejs-on-ubuntu

    * Python3: <br />
                - The following command could be used to install the latest version of Python on almost every Linux system. <br />
            
                        sudo apt-get install python3

        - installation guide for Python3 can also be found at this site: <br />
        https://www.scaler.com/topics/python/install-python-on-linux/ <br />
    
    * pip: & python-venv <br />
        - Use the following command to install pip for Python 3:
                
                sudo apt install python3-pip

        - Use the following command to install venv:    

                sudo apt install python3-pip python3-venv -y

        - Upgrade pip: This can be done by running the following command: <br />
            
                pip install --upgrade pip

2. After successfully downloading the necessary software to the VM, pull the SEDAR project from gitlab to your VM using the command: <br />
        
            git clone -b <branch_name> https://<username>:<password>@data-science.hsnr.de/gitlab/abschlussarbeiten/sedar.git 

    - Open the project folder: <br />
        
            cd sedar/sedar/

    - And check if you are in the correct branch.
        
            git branch

3. Go to .env file where all the port and host IP addresses, secret keys and global definitions of containers and some packages are at.
    - Select the IP address of backend host and right click on it. It should look like this:<br />
        
        BACKEND_HOST=<ipaddressofhostsystem>

        >Storing information in .env makes information easily accessible and changeable.
        >Secret key is used to generate a signature for the authentication payload to ensure the authenticity and integrity of the token. Secret key is a standard method for representing claims securely between two parties, commonly used for authentication purposes in web applications.<br />
    - Then select the IP address, click on change all occurances and change your end of IP address:

    > By doing this, services will be able to communicate with eachother and frontend and backend will be connected via the new IP address.

4. After pulling the project files onto the VM and changing the IP in .env file, start running the .yaml files in order with the following.<br />
The .yaml files can be seen in the directory ~sedar/sedar/ <br />
    - To use docker-compose command without needing to use superuser priveledges use this command:<br />
        
            sudo usermod -aG docker <your_username>

    - Log out of your current session and log back in (or restart your system) to apply the group changes.

    >It is now possible to use docker-compose commands without sudo. Being a member of the docker group allows you
    >to interact with the Docker daemon as a regular user,eliminating the need to elevate permissions each time you use Docker commands.
    
    1. dev.yaml <br />
        add cython by typing cython in the file that locates in sedar>sedar>dockerfiles>jupyterhub>spawnContainer>requirements.txt and run the command below.
        
            docker compose -f dev.yaml build

        > If this command results with the error failed to solve: process "/bin/bash -o pipefail -c python3 -m pip install --no-cache -r /tmp/requirements.txt" did not complete successfully: exit code: 1

    2. services.yaml <br />
        
            docker compose -f services.yaml build

    3. commons.yaml <br />
        Now start running the command bellow:    
        
            docker compose -f commons.yaml build
        
        > While running the command above if you get the following error: <br />
        failed to solve: process "/bin/sh -c apt-get update &&     apt-get install -y openjdk-11-jre-headless && <br />
        apt-get install -y ant &&     apt-get clean;" did not complete successfully: exit code: 100 <br />
        >> Go to the file sedar/sedar/dockerfiles/commons.docker and change the python version at line 1 to the command below and
        run the command again. <br />
                FROM python:3.9-buster

5. Frontend <br />
    * It is necessary to forward ports to connect services and containers to frontend.<br />
        - Forward these ports in VScode by selecting 'ports' on top of the terminal and then click 'add port'.<br />
          80   :localhost<br />
          7687 :neo4j<br />
          5000 :python3<br />
          8000 :docker-pr<br />
          9870 :docker-pr

    * Use the command below to install dependencies which locates in sedar/sedar/frontend/: <br />
        
            npm install
    * This command will run sedar frontend and if there are non-compatible packages, if the packages are compatible with current dependency versions, frontend will be running.<br />
        
            npm run start
    > you can check and change versions of packages in the sedar/sedar/frontend/ directory.<br />

    > If port 80 gives an error because it is in use, check activity using the command below.<br />
        sudo lsof -i :80<br />
    > And you can run the frontend again after terminating the activity on port 80.

6. Backend <br />
    * Create virtual enviroment named flask using the command: <br />
        
            python3 -m venv flask
        And activate the virtual enviroment. After activating you will see your directory will change. 
        Directory will be now under (flask) enviroment.<br />
        
            source flask/bin/activate
    * install the requirement files that are shown below to virtual enviroment: <br />
        Mainbackend/requirements.txt <br />
        Commons/requirements.txt <br />
            
                cd sedar/sedar/backend/commons
        - For installation of requirements.txt file:<br />
            
                pip install -r ./sedar/sedar/backend/commons/requirements.txt
                pip install -r ./sedar/sedar/backend/mainbackend/requirements.txt

        >After installing both files, you can check the installed packages with $pip list command.

7. Running the system <br />
    - run the command:

                sudo nano /etc/hosts
        type namenode datanode1 next to YOUR:IP:ADDRESS localhost then exit with ctrl+X and save changes by pressing Y.
    - install python extension in vscode
    - then create launch.json from Run & Debug Tab
    - Go to .vscode/ directory and change the package.json file to:

                {
                "version": "0.2.0",
                "configurations": [
                {
                "name": "Mainbackend",
                "python":"/home/<USER_NAME>/sedar/sedar/backend/mainbackend/flask/bin/python3",
                "type": "python",
                "request": "launch",
                "cwd": "/home/<USER_NAME>/sedar/sedar/backend/mainbackend",
                "program": "main_server.py",
                "console": "integratedTerminal",
                "envFile": "/home/<USER_NAME>/sedar/sedar/.env",
                },
                {
                "name": "Ingestion Service",
                "python":"/home/<USER_NAME>/sedar/sedar/backend/mainbackend/flask/bin/python3",
                "type": "python",
                "request": "launch",
                "cwd": "/home/<USER_NAME>/sedar/sedar/backend/mainbackend",
                "program": "server.py",
                "console": "integratedTerminal",
                "envFile": "/home/<USER_NAME>/sedar/sedar/.env",
                },
                {
                "name": "Continuation Service",
                "python":"/home/<USER_NAME>/sedar/sedar/backend/mainbackend/flask/bin/python3",
                "type": "python",
                "request": "launch",
                "cwd": "/home/<USER_NAME>/sedar/sedar/backend/mainbackend",
                "program": "server.py",
                "console": "integratedTerminal",
                "envFile": "/home/<USER_NAME>/sedar/sedar/.env",
                },
                {
                "name": "Schema Service",
                "python":"/home/<USER_NAME>/sedar/sedar/backend/mainbackend/flask/bin/python3",
                "type": "python",
                "request": "launch",
                "cwd": "/home/<USER_NAME>/sedar/sedar/backend/mainbackend",
                "program": "server.py",
                "console": "integratedTerminal",
                "envFile": "/home/<USER_NAME>/sedar/sedar/.env",
                },
                {
                "name": "Profiling Service",
                "python":"/home/<USER_NAME>/sedar/sedar/backend/mainbackend/flask/bin/python3",
                "type": "python",
                "request": "launch",
                "cwd": "/home/<USER_NAME>/sedar/sedar/backend/mainbackend",
                "program": "server.py",
                "console": "integratedTerminal",
                "envFile": "/home/<USER_NAME>/sedar/sedar/.env",
                }
              ]
          }
    - Change the username to your username for the directories.
    - Go back to sedar/sedar/backend directory and run the command:

                source .env
    - Create four terminals to run ingestion, continuation, schema and profiling services.
      make sure you have activated virtual enviroment 'flask' and for all terminals use the commands in order:
                
                cd /home/aozturk/sedar/sedar/backend/services/ingestion/
                python3 server.py

                cd /home/aozturk/sedar/sedar/backend/services/continuation/
                python3 server.py

                cd /home/aozturk/sedar/sedar/backend/services/schema/
                python3 server.py

                cd /home/aozturk/sedar/sedar/backend/services/profiling/
                python3 server.py
                

    > It is suggested that you open two terminals side by side, one for frontend, one for backend to run the system.
   

    1. Backend: <br />
        Make sure you are at the correct directory which is (flask)~home/<USER>/ <br />
        And then run the command to execute backend: <br />
                
                python3 main_server.py
    2. Frontend: <br />
        Make sure you are at the correct directory which is ~sedar/sedar/frontend <br />
        And then run the command to execute frontend: <br />
                
                npm run start


* Debugging commands and tools: <br />
    - htop <br />
        This software lets you see if your device has enough memory and it shows CPU usage rate. <br />
        To install htop, type the commands below to your terminal: <br />
        
            sudo apt-get update
            sudo apt-get install htop
        - Type htop to terminal to open the program and check the memory and CPU usage while executing the command that gives error.

    - Command to kill all dockers: <br />
        
            docker rm -f $(docker ps -a -q)
        > This comand will forcefully remove all stopped containers on your system, freeing up resources and disk space. Be cautious when using this command, as it will permanently delete all stopped containers, and any data stored inside those containers will be lost.
This command is often used in scenarios where you want to clean up old or unused containers or as part of a script or automation to clean up the system periodically.<br />

    - Command to reboot the system: <br />

        > all containers must be terminated before reboot. <br />

        
            sudo reboot 0

    - Command to restart system: <br />
        
            sudo systemctl restart docker
        >it will attempt to stop the Docker service, wait for a moment, and then start it again. This can be useful when you've made changes to the Docker configuration or when you want to apply updates or changes to the Docker software.

    - Command to stop a container: <br />
        
            docker stop <container_name>
        > This command will gracefully stop the container, allowing it to perform any necessary cleanup tasks before shutting down.<br />

## Testing the system
1. If the website is running, go to profile icon, click on test and click start button at bottom of the page. It will automatically start 84 test cases that shows if system is working as intended.
