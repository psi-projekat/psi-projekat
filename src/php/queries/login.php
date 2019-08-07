<?php
  class Login extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select idUser as id, isMod from User
        where nick = ? and passHash = ?
      ');
      $st->execute([$args->nick, $args->passHash]);
      $row = $st->fetch();

      if($row === false){
        $this->err('wrongNickOrPass');
        return;
      }

      $pdo->prepare('
        update User
        set token = ?
        where idUser = ?
      ')->execute([$args->token, $row['id']]);

      $this->succ([
        'isMod' => $row['isMod'],
      ]);
    }
  }

  new Login();
?>