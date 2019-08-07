<?php
  class Register extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select count(*) from User
        where nick = ?
      ');
      $st->execute([$args->nick]);
      $num = $st->fetchColumn();

      if($num === 0){
        $pdo->prepare('
          insert into User (
            nick,
            passHash,
            email,
            displayEmail,
            isMod,
            registrationDate,
            points
          ) values (?, ?, ?, false, false, ?, 0)
        ')->execute([
          $args->nick,
          $args->passHash,
          $args->email,
          $this->date,
        ]);

        $this->succ();
      }else{
        $this->err('nickExists');
      }
    }
  }

  new Register();
?>